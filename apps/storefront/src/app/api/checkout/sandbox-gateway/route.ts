import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost, LoomError } from '@/lib/loom/client';
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

  // Even in sandbox mode, the payment id and signature that make a callback
  // pass verification can only come from Loom's own sandbox gateway — a
  // locally invented signature would either be meaningless or, worse, be
  // accepted by a callback path that doesn't actually check it.
  try {
    const data = await loomPost('/checkout/sandbox-gateway/complete', { orderId }, {
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
    return NextResponse.json({ success: false, message: 'Sandbox gateway is unreachable.' }, { status: 502 });
  }
}
