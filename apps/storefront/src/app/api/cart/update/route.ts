import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPatch } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { isWrapperToken } from '@/lib/loom/token';

// PATCH /api/cart/update  body: { id, quantity }
// Proxies the native PATCH /update/cart-item (self, ownership + sandbox-floor
// enforced backend-side). Mirrors app/api/cart/add's auth/reauth semantics.
export async function PATCH(request: Request) {
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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }
  const id = Number((body as { id?: unknown })?.id);
  const quantity = Number((body as { quantity?: unknown })?.quantity);
  if (!Number.isFinite(id) || !Number.isFinite(quantity) || quantity < 0) {
    return NextResponse.json({ success: false, message: 'id and a non-negative quantity are required.' }, { status: 400 });
  }
  try {
    const result = await loomPatch('/update/cart-item', { id, quantity }, { token });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { success: false, message: e?.message || 'Failed to update cart.' },
      { status: e?.status || 500 },
    );
  }
}
