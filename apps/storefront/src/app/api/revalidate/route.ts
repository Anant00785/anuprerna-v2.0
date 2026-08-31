import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

// POST /api/revalidate — internal on-demand ISR nudge for the sandbox.
//
// Only ever called by THIS SAME process's own background poller
// (instrumentation.ts), which notices when the sandbox wrapper's product
// watermark advances and hits this route to drop the tagged fetch-cache
// entries — that's what gets a CMS price/content edit onto the page in
// seconds instead of waiting out the 30-min `revalidate` window.
//
// Gated by SANDBOX_REVALIDATE_SECRET, which is set ONLY on the
// storefront-sandbox pm2 process's env. It is unset on storefront-local and
// on the public Vercel deployment, so there this route always 404s and is
// never wired to anything — zero behavioural change there.
export async function POST(req: Request): Promise<Response> {
  const expected = process.env.SANDBOX_REVALIDATE_SECRET;
  if (!expected) {
    return NextResponse.json({ success: false, message: 'Revalidate not configured.' }, { status: 404 });
  }
  const got = req.headers.get('x-revalidate-secret');
  if (got !== expected) {
    return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 });
  }

  const tags = ['products', 'loom-catalogue'];
  for (const tag of tags) revalidateTag(tag);

  return NextResponse.json({ success: true, revalidated: tags });
}
