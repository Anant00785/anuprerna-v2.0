import { NextResponse } from 'next/server';
import { postNewsletterSubscribe } from '@/components/misc-pages/loom';

// POST { email, source?, hp? } -> newsletter signup.
// Wired to postNewsletterSubscribe() -> the sandbox wrapper's native
// POST /send/newsletter-subscribe, which upserts into its own
// newsletter_subscription table (see anuprerna-rebuild/backend/src/newsletter/*).
// No live Loom endpoint for this has ever existed, so there is nothing to
// accidentally reach -- this is a net-new, sandbox-only, own-table write.
//
// Same honeypot + per-IP rate-limit pattern as app/api/contact/route.ts --
// this IS the true public-facing edge; the backend's own limiter is secondary.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const rateLimitByIp = new Map<string, { count: number; windowStart: number }>();

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitByIp.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitByIp.set(ip, { count: 1, windowStart: now });
    return true;
  }
  entry.count += 1;
  return entry.count <= RATE_LIMIT_MAX;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid body.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email) {
    return NextResponse.json({ success: false, message: 'Email required.' }, { status: 400 });
  }

  // Honeypot: silently pretend success, never even reach the backend.
  const hp = typeof body.hp === 'string' ? body.hp.trim() : '';
  if (hp) {
    return NextResponse.json({ success: true });
  }

  const ip = clientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ success: false, message: 'Too many requests, please try again later.' });
  }

  const source = typeof body.source === 'string' && body.source.trim() ? body.source.trim() : undefined;
  const result = await postNewsletterSubscribe(email, source);
  return NextResponse.json(result);
}
