import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost, LoomError } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { GUEST_ORDER_COOKIE } from '@/lib/checkout-session';

// =====================================================================================
// POST /api/checkout/payment-callback — STEP 3: the gateway callback.
//
// Backend contract: POST /checkout/payment-callback
//   { orderId, sessionId, providerOrderId, providerPaymentId, signature }
// The backend re-derives the signature and REJECTS a mismatch; on success it
// records the transaction, flips every order item to PAID/PROCESSING and fires
// the (suppressed) confirmation-email seam. Idempotent — a replay is a no-op.
//
// With a real gateway this is the route the gateway itself calls (webhook) or the
// browser redirect lands on; the shape is unchanged either way.
// =====================================================================================

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
    return NextResponse.json(data);
  } catch (e: unknown) {
    if (e instanceof LoomError) {
      const b = e.body as { message?: string } | undefined;
      return NextResponse.json({ success: false, message: b?.message || 'Payment could not be confirmed.' }, { status: e.status });
    }
    return NextResponse.json({ success: false, message: 'Payment could not be confirmed.' }, { status: 502 });
  }
}
