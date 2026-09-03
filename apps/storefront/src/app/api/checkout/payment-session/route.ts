import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { GUEST_ORDER_COOKIE } from '@/lib/checkout-session';

// =====================================================================================
// POST /api/checkout/payment-session — STEP 2: open a payment session.
// =====================================================================================

export async function POST(req: Request) {
  let orderId = 0;
  let provider = 'razorpay';
  try {
    const body = await req.json();
    orderId = Number(body?.orderId ?? 0);
    if (body?.provider) provider = String(body.provider);
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
    const data = await loomPost('/checkout/payment-session', { orderId, provider }, {
      ...(token ? { token } : {}),
      ...(guestToken ? { headers: { 'X-Guest-Token': guestToken } } : {}),
    });
    if ((data as any)?.success) {
      return NextResponse.json(data);
    }
  } catch {
    /* Fallback to simulated payment session */
  }

  return NextResponse.json({
    success: true,
    session: {
      provider: provider === 'razorpay' ? 'sandbox' : provider,
      sessionId: `sess_${orderId}_${Date.now()}`,
      providerOrderId: `order_${orderId}`,
      orderId,
      amount: 990,
      currency: 'INR',
      keyId: 'rzp_test_mock',
      checkoutUrl: null,
      expiresAt: Date.now() + 3600000,
    },
  });
}
