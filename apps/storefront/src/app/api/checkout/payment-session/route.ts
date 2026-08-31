import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost, LoomError } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { GUEST_ORDER_COOKIE } from '@/lib/checkout-session';

// =====================================================================================
// POST /api/checkout/payment-session — STEP 2: open a payment session.
//
// Backend contract: POST /checkout/payment-session { orderId }.
// Authorisation is the loom_jwt bearer OR the X-Guest-Token header taken from the
// httpOnly ap_guest_order cookie — the browser never handles the guest token here.
// Response: { success, session: { provider, sessionId, providerOrderId, orderId,
//             amount, currency, keyId, checkoutUrl, expiresAt } }.
// =====================================================================================

export async function POST(req: Request) {
  let orderId = 0;
  try {
    const body = await req.json();
    orderId = Number(body?.orderId ?? 0);
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return NextResponse.json({ success: false, message: 'orderId is required.' }, { status: 400 });
  }

  const jar = await cookies();
  const token = jar.get(LOOM_JWT_COOKIE)?.value;
  const guestToken = jar.get(GUEST_ORDER_COOKIE)?.value;
  if (!token && !guestToken) {
    return NextResponse.json({ success: false, message: 'No checkout in progress.' }, { status: 401 });
  }

  try {
    const data = await loomPost('/checkout/payment-session', { orderId }, {
      ...(token ? { token } : {}),
      ...(guestToken ? { headers: { 'X-Guest-Token': guestToken } } : {}),
    });
    return NextResponse.json(data);
  } catch (e: unknown) {
    const status = e instanceof LoomError ? e.status : 502;
    return NextResponse.json({ success: false, message: 'Could not open a payment session.' }, { status });
  }
}
