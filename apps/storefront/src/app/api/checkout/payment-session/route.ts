import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost, LoomError } from '@/lib/loom/client';
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

  // The order's real amount, currency and provider order id live only in
  // Loom. A session that fails to open there must not be silently replaced
  // with a fabricated amount and a "sandbox" gateway the buyer never chose.
  try {
    const data = await loomPost('/checkout/payment-session', { orderId, provider }, {
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
    return NextResponse.json({ success: false, message: 'Payment session service is unreachable.' }, { status: 502 });
  }
}
