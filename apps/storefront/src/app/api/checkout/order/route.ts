import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost, LoomError } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import {
  GUEST_CHECKOUT_COOKIE, GUEST_ORDER_COOKIE, GUEST_ORDER_MAX_AGE, decodeGuest,
} from '@/lib/checkout-session';

// =====================================================================================
// POST /api/checkout/order — STEP 1 of checkout: create the order.
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

  const payload: Record<string, unknown> = { ...body };
  delete payload.guest;
  if (!token && guest) payload.guest = guest;

  // Loom is the only source of truth for an order id, amount and guest
  // token — never invent them here. A decline, a non-2xx, or an unreachable
  // backend all surface as a real error instead of a fabricated success.
  try {
    const data = await loomPost<{
      success?: boolean; message?: string; orderId?: number; orderNumber?: string;
      amount?: number; currency?: string; guestOrder?: boolean; guestToken?: string;
    }>('/checkout/order', payload, token ? { token } : undefined);

    if (!data?.success) {
      return NextResponse.json({ success: false, ...data }, { status: 400 });
    }

    const res = NextResponse.json(data);
    if (data.guestToken) {
      res.cookies.set(GUEST_ORDER_COOKIE, data.guestToken, {
        httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: GUEST_ORDER_MAX_AGE,
      });
    }
    return res;
  } catch (err) {
    if (err instanceof LoomError) {
      const body = (err.body && typeof err.body === 'object') ? err.body as Record<string, unknown> : {};
      return NextResponse.json({ success: false, message: err.message, ...body }, { status: err.status });
    }
    return NextResponse.json({ success: false, message: 'Order service is unreachable.' }, { status: 502 });
  }
}
