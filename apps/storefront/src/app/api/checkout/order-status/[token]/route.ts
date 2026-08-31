import { NextResponse } from 'next/server';
import { loomGet, LoomError } from '@/lib/loom/client';

// GET /api/checkout/order-status/<token> — the GUEST order-status read.
// Backend contract: GET /checkout/order-status/{token} -> { order, success }.
// The token IS the authorisation: unguessable (32 random bytes) and stored only
// as a SHA-256 hash server-side, so no login is required and a database read
// cannot impersonate the buyer. A bad token 404s.
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!token) return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
  try {
    const data = await loomGet<{ order?: unknown; success?: boolean }>(
      '/checkout/order-status/' + encodeURIComponent(token),
    );
    return NextResponse.json(data);
  } catch (e: unknown) {
    const status = e instanceof LoomError && e.status === 404 ? 404 : 502;
    return NextResponse.json({ success: false, message: 'Order not found.' }, { status });
  }
}
