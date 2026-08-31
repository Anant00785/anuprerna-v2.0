import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost, LoomError } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { GUEST_ORDER_COOKIE } from '@/lib/checkout-session';

// =====================================================================================
// POST /api/checkout/sandbox-gateway — the MOCKED THIRD PARTY.
//
// Stands in for "the buyer pays on the Razorpay modal and Razorpay signs the
// result". Backend contract: POST /checkout/sandbox-gateway/complete { orderId }
// -> { success, callback: { orderId, sessionId, providerOrderId, providerPaymentId,
// signature } }, which the client then posts to /api/checkout/payment-callback.
//
// THIS IS THE ONE ROUTE A REAL INTEGRATION DELETES. The backend 404s it whenever
// the active PaymentProvider does not implement simulateCompletion(), so wiring a
// real gateway makes it disappear on its own. Its output is NOT trusted: the
// callback still has to pass server-side signature verification.
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
    const data = await loomPost('/checkout/sandbox-gateway/complete', { orderId }, {
      ...(token ? { token } : {}),
      ...(guestToken ? { headers: { 'X-Guest-Token': guestToken } } : {}),
    });
    return NextResponse.json(data);
  } catch (e: unknown) {
    const status = e instanceof LoomError ? e.status : 502;
    return NextResponse.json(
      { success: false, message: 'The sandbox gateway is not available for the active payment provider.' },
      { status },
    );
  }
}
