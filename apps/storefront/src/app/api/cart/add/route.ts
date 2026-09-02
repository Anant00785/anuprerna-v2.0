import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { isWrapperToken } from '@/lib/loom/token';
import { decodeTokenPayload } from '@/lib/auth/token-helper';
import { localCartStore } from '@/lib/cart/local-cart-store';

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

  const payload = decodeTokenPayload(token);
  const email = (payload?.email || payload?.sub || '') as string;

  // Save to local cart store
  let localItem: unknown = null;
  if (email) {
    localItem = localCartStore.addItem(email, body);
  }

  // Best-effort remote / backend sync
  try {
    const result = await loomPost('/add/cart-item', body, { token });
    return NextResponse.json(result);
  } catch {
    // If remote Loom rejects or is unavailable, our persistent local store already recorded it
    return NextResponse.json({
      success: true,
      message: 'Item added to cart.',
      entity: localItem,
    });
  }
}
