import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomDelete } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { isCartCapableToken } from '@/lib/loom/token';

export async function POST(request: Request) {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
  }
  if (!isCartCapableToken(token)) {
    return NextResponse.json(
      { success: false, reauth: true, message: 'Your session has expired — please sign in again.' },
      { status: 401 },
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }
  const id = Number((body as { id?: unknown })?.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ success: false, message: 'A valid cart item id is required.' }, { status: 400 });
  }

  try {
    const result = await loomDelete('/delete/cart-item/' + id, { token });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false, message: 'Could not remove the cart item.' }, { status: 502 });
  }
}
