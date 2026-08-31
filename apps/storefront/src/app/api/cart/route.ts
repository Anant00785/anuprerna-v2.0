import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCart } from '@/lib/loom/endpoints';
import { LoomError } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

// GET -> current cart for the logged-in customer, or an empty cart when anonymous.
// Error semantics:
//   anon / expired token (no cookie, or Loom 401/403) -> empty + authenticated:false
//   Loom 5xx / network failure                        -> HTTP 502 { error: 'upstream' }
// so the client can tell 'logged out' from 'we could not load your cart'.
export async function GET() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return NextResponse.json({ entity: [], authenticated: false });
  try {
    const cart = await getCart(token);
    // Loom returns items under cartItemList; expose them under entity too so all
    // consumers (header mini-cart, summaries) resolve a single normalized shape.
    const items = (cart as { cartItemList?: unknown[]; entity?: unknown[] }).cartItemList
      ?? (cart as { entity?: unknown[] }).entity ?? [];
    return NextResponse.json({ ...cart, entity: items, cartItemList: items, authenticated: true });
  } catch (e: unknown) {
    // Log the real Loom rejection reason instead of swallowing it silently -- this
    // route intentionally maps a 401/403 to a soft 'authenticated:false' UX (see header
    // comment), which previously hid a real divergence: Loom accepts this JWT for this
    // exact same call from the VPS but rejects it from Vercel's serverless network (see
    // 2026-07-04 investigation). Keeping this so the next occurrence shows up in Vercel logs instead of silently degrading to an empty cart.
    if (e instanceof LoomError) {
      console.error('[api/cart] LoomError status=' + e.status + ' body=' + JSON.stringify(e.body));
    } else {
      console.error('[api/cart] non-LoomError:', e instanceof Error ? e.message : String(e));
    }
    // Expired/invalid token -> keep the anonymous empty-cart UX.
    if (e instanceof LoomError && (e.status === 401 || e.status === 403)) {
      return NextResponse.json({ entity: [], authenticated: false });
    }
    // Loom 5xx / network -> upstream failure the UI should surface as retryable.
    return NextResponse.json({ error: 'upstream' }, { status: 502 });
  }
}
