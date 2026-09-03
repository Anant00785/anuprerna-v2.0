import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost, LoomError } from '@/lib/loom/client';
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
  } catch (err) {
    // This catch used to discard `err` entirely and answer a flat 502 "Could not
    // add the item to your cart." That message was the ONLY signal, for every
    // cause — expired session, rejected payload, backend down — so a stale login
    // was indistinguishable from an outage in both the UI and the logs.
    const status = err instanceof LoomError ? err.status : 0;
    console.error(
      '[cart/add] POST /add/cart-item failed',
      JSON.stringify({ status, body: err instanceof LoomError ? err.body : String(err) }).slice(0, 500),
    );

    // 401/403 is a dead session, not a server fault. The browser already knows
    // how to handle `reauth` (see the same signal above for a non-wrapper token),
    // so surface it instead of burying it in a generic failure.
    if (status === 401 || status === 403) {
      return NextResponse.json(
        { success: false, reauth: true, message: 'Your session has expired — please sign in again.' },
        { status: 401 },
      );
    }
    return NextResponse.json({ success: false, message: 'Could not add the item to your cart.' }, { status: 502 });
  }
}
