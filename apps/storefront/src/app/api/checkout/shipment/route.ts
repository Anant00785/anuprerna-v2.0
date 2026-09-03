import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomGet, LoomError } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

// =====================================================================================
// GET /api/checkout/shipment — the shipping options, and their PRICES.
//
// THIS ROUTE USED TO INVENT MONEY. When both upstreams failed it answered
// `200 { success: true }` with a hardcoded DEFAULT_SHIPMENT_LIST carrying real
// rupee amounts (₹200 express, ₹150 regular, ₹3000 international). The caller
// could not tell a live quote from the fabrication, and the figure flowed
// straight into a real order total: a buyer could be quoted, and charged, a
// price no backend ever produced.
//
// A shipping price is not a default. If no backend can quote one, the honest
// answer is that we do not have one — so this now fails with 502 and relays
// the backend's own message, exactly like /api/profile/addresses. Both
// CheckoutShell load paths already treat a non-OK response as a hard load
// error and render the error state, so the checkout stops instead of
// proceeding on a made-up number.
// =====================================================================================

export async function GET() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;

  // This used to probe a hardcoded `http://127.0.0.1:3000/get/shipment-list`
  // first, then fall through to Loom. LOOM_BASE_URL now defaults to that same
  // backend (apps/api serves the legacy shipment paths), so the probe was the
  // SAME request twice — and in tests the two collided on one URL. There is one
  // upstream, reached through the BFF client like every other Loom call, so it
  // picks up the shared headers, the write-guard and the auth handling instead
  // of re-implementing them.
  const path = token ? '/get/shipment-list' : '/checkout/shipment-list';

  try {
    const data = await loomGet<{ shipmentList?: unknown[]; success?: boolean; message?: string }>(
      path,
      token ? { token } : undefined,
    );
    const list = data?.shipmentList;
    if (Array.isArray(list) && list.length > 0) {
      return NextResponse.json({ ...data, authenticated: !!token });
    }
    // A reachable backend with nothing to offer is still "no quote available" —
    // it is NOT an empty list the checkout may proceed past.
    return NextResponse.json(
      {
        shipmentList: [],
        success: false,
        authenticated: !!token,
        message: data?.message || 'No shipping options are available right now.',
      },
      { status: 502 },
    );
  } catch (e: unknown) {
    const body = e instanceof LoomError ? (e.body as { message?: string } | undefined) : undefined;
    return NextResponse.json(
      {
        shipmentList: [],
        success: false,
        authenticated: !!token,
        message: body?.message || 'Could not load shipping options.',
      },
      { status: 502 },
    );
  }
}
