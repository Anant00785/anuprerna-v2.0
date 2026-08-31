import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { isWrapperToken } from '@/lib/loom/token';

// POST /api/customer/b2b-profile
// SELF-DECLARE WHOLESALE (fast lane): forwards the self-declared business profile
// to the wrapper's authenticated `customer/b2b-profile` endpoint, which captures
// the profile AND flips the native buyerType b2c -> b2b in one flow. On success
// the client re-fetches /api/auth/me so BuyerModeProvider picks up buyerType:'b2b'
// and the storefront switches to B2B mode immediately.
//
// Auth handling mirrors /api/cart/add: a wrapper soft-denial ('Authorization has
// been denied.') means the JWT is not a valid native session (stale/foreign
// cookie) -> map to a re-login prompt. GST-less bodies are valid (only company
// name / business type(s) / country are required, enforced by the wrapper).

function isAuthDenied(result: unknown): boolean {
  const msg = (result as { message?: unknown })?.message;
  return typeof msg === 'string' && /authorization has been denied/i.test(msg);
}

export async function POST(request: Request) {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
  }

  // STALE / FOREIGN COOKIE GUARD: a non-wrapper token can never write natively.
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
    const result = await loomPost('/customer/b2b-profile', body, { token });
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
      { success: false, message: e?.message || 'Failed to submit wholesale application.' },
      { status: e?.status || 500 },
    );
  }
}
