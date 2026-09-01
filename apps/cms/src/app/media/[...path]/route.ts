import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// GET /media/[...path] — THIN PROXY to the backend's /media/* route.
//
// Ported from the storefront's app/media/[...path]/route.ts. Every Weave
// response has its live Bloomscorp S3 image URLs rewritten to a relative
// /media/<key> path at each fetch boundary (lib/media.ts). This route
// forwards that request to the NestJS wrapper (:8090), which is the ONE place
// that reads the PRIVATE, localhost-only MinIO mirror (bucket
// anuprerna-media-backup) and streams the object back — or 302-redirects to
// the live Bloomscorp original on a genuine miss (a not-yet-backfilled key
// degrades to live rather than 404ing; still never a DIRECT fetch from
// Weave's own server).
//
// Reuses BACKEND_URL — the SAME env var every other Weave data module uses to
// reach the backend — so this works identically wherever Weave runs.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8090';

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await ctx.params;
  const segments = (path ?? []).filter(Boolean);
  if (segments.length === 0) return new Response('Not found', { status: 404 });

  const rawPath = segments.join('/');
  const encoded = segments.map((s) => encodeURIComponent(s)).join('/');
  const upstreamUrl = `${BACKEND}/media/${encoded}`;
  const s3FallbackUrl = `https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/${rawPath}`;

  try {
    let res = await fetch(upstreamUrl, { redirect: 'follow', cache: 'no-store' });
    if (!res.ok) {
      res = await fetch(s3FallbackUrl, { redirect: 'follow' });
    }
    if (res.ok && res.body) {
      const headers: Record<string, string> = {
        'Content-Type': res.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      };
      return new Response(res.body, { status: 200, headers });
    }
  } catch {
    try {
      const fbRes = await fetch(s3FallbackUrl, { redirect: 'follow' });
      if (fbRes.ok && fbRes.body) {
        const headers: Record<string, string> = {
          'Content-Type': fbRes.headers.get('content-type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        };
        return new Response(fbRes.body, { status: 200, headers });
      }
    } catch {
      // ignore
    }
  }

  return Response.redirect(s3FallbackUrl, 302);
}
