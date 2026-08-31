import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomGet } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

// GET /api/product/trade-pricing?group=fabric|finished&slug=<product-slug>
//
// THE ONE WAY THE VOLUME-TIER LADDER REACHES A BROWSER.
//
// The product page itself is ISR-cached: one payload, generated with no session,
// served to everybody — so it can never carry anything caller-specific, and the
// wrapper strips the ladder out of it for exactly that reason. This route is the
// per-request, never-cached companion: it forwards the caller's session and the
// wrapper decides. An unentitled caller gets the platform soft denial (HTTP 200,
// success:false), which is ALSO what an anonymous caller gets, so the answer
// cannot be read as "this session is a business account".
//
// no-store is load-bearing: a cached response here would hand one buyer's
// entitlement to the next.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const group = url.searchParams.get('group') === 'finished' ? 'finished' : 'fabric';
  const slug = (url.searchParams.get('slug') ?? '').trim();
  if (!slug || !/^[a-zA-Z0-9._~-]+$/.test(slug)) {
    return NextResponse.json({ success: false, message: 'A product slug is required.' }, { status: 400 });
  }

  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  // No session at all: answer with the SAME shape the wrapper gives an
  // unentitled caller, without a round trip. Same body either way.
  if (!token) {
    return NextResponse.json({ success: false, entitled: false, message: 'Trade pricing is available on business accounts.' });
  }
  try {
    const result = await loomGet('/trade-pricing/' + group + '/' + encodeURIComponent(slug), { token });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false, entitled: false, message: 'Trade pricing is unavailable right now.' });
  }
}
