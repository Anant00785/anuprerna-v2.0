import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { GUEST_ORDER_COOKIE } from '@/lib/checkout-session';

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
    if ((data as any)?.success) {
      return NextResponse.json(data);
    }
  } catch {
    /* Fallback to simulated callback */
  }

  return NextResponse.json({
    success: true,
    callback: {
      orderId,
      sessionId: `sess_${orderId}`,
      providerOrderId: `order_${orderId}`,
      providerPaymentId: `pay_${Date.now()}`,
      signature: `sig_sandbox_${Date.now()}`,
    },
  });
}
