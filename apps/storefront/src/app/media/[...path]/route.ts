import { LOOM_BASE_URL } from '@/lib/loom/config';

// ---------------------------------------------------------------------------
// GET /media/[...path] — THIN PROXY to the sandbox backend's /media/* route.
//
// Every Loom response has its live Bloomscorp S3 image URLs rewritten to a
// relative /media/<key> path at the fetch boundary (lib/loom/media.ts). This
// route forwards that request to the NestJS wrapper, which is the ONE place
// that reads the PRIVATE, localhost-only MinIO mirror (bucket
// anuprerna-media-backup) and streams the object back — or 302-redirects to the
// live Bloomscorp original on a genuine miss.
//
// It reuses LOOM_BASE_URL — the SAME env var the app already uses to reach the
// backend for data — so ONE code path works on BOTH surfaces:
//   * VPS sandbox  : LOOM_BASE_URL = http://127.0.0.1:8090  (backend, localhost)
//   * Vercel demo  : LOOM_BASE_URL = the backend cloudflared tunnel URL
// Vercel can therefore serve sandbox media WITHOUT ever reaching MinIO directly
// (which is impossible from Vercel — MinIO binds 127.0.0.1 only). The storefront
// no longer needs any MinIO credentials.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await ctx.params;
  const segments = (path ?? []).filter(Boolean);
  if (segments.length === 0) return new Response('Not found', { status: 404 });

  const rawPath = segments.join('/');
  const encoded = segments.map((s) => encodeURIComponent(s)).join('/');
  const upstreamUrl = LOOM_BASE_URL + '/media/' + encoded;
  const s3FallbackUrl = `https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/${rawPath}`;

  try {
    let res = await fetch(upstreamUrl, { redirect: 'follow' });
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
