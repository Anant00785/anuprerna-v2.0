import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { isWrapperToken } from '@/lib/loom/token';

export async function POST(request: Request) {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
  }

  if (!isWrapperToken(token)) {
    return NextResponse.json(
      { success: false, reauth: true, message: 'Your session has expired — please sign in again.' },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }

  // The backend owns the cart. A failure is reported rather than masked as a
  // success against a local file the next request would not see.
  try {
    const result = await loomPost('/add/cart-item', body, { token });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false, message: 'Could not add the item to your cart.' }, { status: 502 });
  }
}
