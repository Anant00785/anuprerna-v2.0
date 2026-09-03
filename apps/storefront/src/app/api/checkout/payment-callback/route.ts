import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost, LoomError } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { GUEST_ORDER_COOKIE } from '@/lib/checkout-session';

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }

  const jar = await cookies();
  const token = jar.get(LOOM_JWT_COOKIE)?.value;
  const guestToken = jar.get(GUEST_ORDER_COOKIE)?.value;
  if (!token && !guestToken) {
    return NextResponse.json({ success: false, message: 'No checkout in progress.' }, { status: 401 });
  }

  // The backend is the only party that can verify a Razorpay/Stripe signature
  // (it holds the key secret). A failure or decline here is a real payment
  // failure — it must never be answered with a fabricated "verified" success.
  try {
    const data = await loomPost('/checkout/payment-callback', {
      orderId: Number(body?.orderId ?? 0),
      sessionId: String(body?.sessionId ?? ''),
      providerOrderId: String(body?.providerOrderId ?? ''),
      providerPaymentId: String(body?.providerPaymentId ?? ''),
      signature: String(body?.signature ?? ''),
    }, {
      ...(token ? { token } : {}),
      ...(guestToken ? { headers: { 'X-Guest-Token': guestToken } } : {}),
    });
    if (!(data as { success?: boolean })?.success) {
      return NextResponse.json({ success: false, ...(data as object) }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof LoomError) {
      const errBody = (err.body && typeof err.body === 'object') ? err.body as Record<string, unknown> : {};
      return NextResponse.json({ success: false, message: err.message, ...errBody }, { status: err.status });
    }
    return NextResponse.json({ success: false, message: 'Payment verification service is unreachable.' }, { status: 502 });
  }
}
