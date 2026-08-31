import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { isWrapperToken } from '@/lib/loom/token';

// POST /api/cart/add
// Body: { fabricProductId | finishedProductId, productGroup, orderType, quantity, unit? }
// Proxies /add/cart-item to Loom with the customer's JWT.
// Returns 401 if not authenticated, 400 on bad body, 200 on success.

// A wrapper soft-denial ('Authorization has been denied.') means the JWT is not
// a valid native session (typically a stale / foreign cookie). Detect it so the
// button can prompt a fresh sign-in instead of a bare 'failed to add'.
function isAuthDenied(result: unknown): boolean {
  const msg = (result as { message?: unknown })?.message;
  return typeof msg === 'string' && /authorization has been denied/i.test(msg);
}

export async function POST(request: Request) {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
  }

  // STALE / FOREIGN COOKIE GUARD: a non-wrapper token can never add to the native
  // cart. Short-circuit to a clean re-login prompt (the durable session teardown
  // happens on the next /api/auth/me call).
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

  try {
    const result = await loomPost('/add/cart-item', body, { token });
    // The wrapper answers auth soft-denials with HTTP 200 { success:false }. Map
    // that to a 401 re-login prompt so the UI stops showing a logged-in cart it
    // can never write to.
    if (isAuthDenied(result)) {
      return NextResponse.json(
        { success: false, reauth: true, message: 'Your session has expired — please sign in again.' },
        { status: 401 },
      );
    }
    return NextResponse.json(result);
  } catch (err: unknown) {
    const e = err as { status?: number; body?: unknown; message?: string };
    return NextResponse.json(
      { success: false, message: e?.message || 'Failed to add to cart.' },
      { status: e?.status || 500 },
    );
  }
}
