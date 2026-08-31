import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost, LoomError } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import {
  GUEST_CHECKOUT_COOKIE, GUEST_ORDER_COOKIE, GUEST_ORDER_MAX_AGE, decodeGuest,
} from '@/lib/checkout-session';

// =====================================================================================
// POST /api/checkout/order — STEP 1 of the real checkout: create the order.
//
// Backend contract: POST /checkout/order (CheckoutController).
//   authenticated -> Authorization: Bearer <loom_jwt>; identity is taken from the
//                    TOKEN and the body cannot name a customer.
//   guest         -> body.guest = { email, name } read from the httpOnly
//                    ap_guest_checkout cookie. The BROWSER never supplies it.
// Response: { success, orderId, orderNumber, amount, currency, guestOrder, guestToken? }
//
// The guest order-status token is (a) stored in an httpOnly cookie so the
// remaining payment steps can authorise without exposing it to page JS, and
// (b) returned once so the buyer gets a durable /order-status/<token> link.
//
// MONEY: whatever this route forwards, the BACKEND recomputes subtotal from the
// line prices and prices shipping from the chosen shipment record; a client
// total is discarded there. Nothing is trusted on the strength of this hop.
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
  const guest = decodeGuest(jar.get(GUEST_CHECKOUT_COOKIE)?.value);

  if (!token && !guest) {
    return NextResponse.json(
      { success: false, message: 'Start checkout with your email first.' },
      { status: 401 },
    );
  }

  // Identity is NEVER read off the posted body here: for a guest it comes from
  // the httpOnly cookie, for a logged-in buyer from the token.
  const payload: Record<string, unknown> = { ...body };
  delete payload.guest;
  if (!token && guest) payload.guest = guest;

  try {
    const data = await loomPost<{
      success?: boolean; message?: string; orderId?: number; orderNumber?: string;
      amount?: number; currency?: string; guestOrder?: boolean; guestToken?: string;
    }>('/checkout/order', payload, token ? { token } : undefined);

    if (!data?.success) {
      return NextResponse.json(data ?? { success: false, message: 'Could not create the order.' }, { status: 400 });
    }

    const res = NextResponse.json(data);
    if (data.guestToken) {
      res.cookies.set(GUEST_ORDER_COOKIE, data.guestToken, {
        httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: GUEST_ORDER_MAX_AGE,
      });
    }
    return res;
  } catch (e: unknown) {
    if (e instanceof LoomError) {
      const b = e.body as { message?: string; exists?: boolean } | undefined;
      // 409 = this email already has a real account -> the UI shows inline sign-in.
      return NextResponse.json(
        { success: false, exists: b?.exists === true, message: b?.message || 'Could not create the order.' },
        { status: e.status },
      );
    }
    return NextResponse.json({ success: false, message: 'Could not create the order.' }, { status: 502 });
  }
}
