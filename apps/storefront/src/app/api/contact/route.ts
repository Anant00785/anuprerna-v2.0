import { NextResponse } from 'next/server';
import { postContactEnquiry } from '@/components/misc-pages/loom';

// POST { name, email, phone, country, ... }
// Wired to postContactEnquiry() -> the sandbox wrapper's native
// POST /send/contact-us, which stores in its own contact_message table (see
// anuprerna-rebuild/backend/src/misc/*). LOOM_BASE_URL resolves to our own
// wrapper at runtime, so this is a zero-live-Loom-mutation, own-table-only
// write -- no real email is ever sent.
//
// PRIMARY honeypot + per-IP rate-limit enforcement lives HERE -- this route
// is the true public-facing edge (behind the Cloudflare tunnel), where
// x-forwarded-for reflects the real visitor. The backend wrapper keeps its
// own (secondary) limiter, but it only ever sees this BFF's loopback address.
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
    return NextResponse.json({ success: false, message: 'Invalid JSON body.' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const country = typeof body.country === 'string' ? body.country.trim() : '';

  if (!name || !email || !phone || !country) {
    return NextResponse.json(
      { success: false, message: 'name, email, phone and country are required.' },
      { status: 400 },
    );
  }

  // Honeypot: a filled `hp` field means a bot filled a field a real visitor
  // never sees (visually hidden in ContactForm.tsx). Silently pretend
  // success -- never tip off bots, never even reach the backend.
  const hp = typeof body.hp === 'string' ? body.hp.trim() : '';
  if (hp) {
    return NextResponse.json({ success: true, message: 'Thank you — your enquiry has been received.' });
  }

  const ip = clientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ success: false, message: 'Too many requests, please try again later.' });
  }

  const company = typeof body.company === 'string' ? body.company.trim() : undefined;
  const companyWebsite = typeof body.companyWebsite === 'string' ? body.companyWebsite.trim() : undefined;
  const productType = typeof body.productType === 'string' ? body.productType.trim() : undefined;
  const productDescription = typeof body.productDescription === 'string' ? body.productDescription.trim() : undefined;
  const quantity =
    typeof body.quantity === 'number' ? body.quantity : (typeof body.quantity === 'string' && body.quantity ? Number(body.quantity) : undefined);
  const deliveryDate = typeof body.deliveryDate === 'string' ? body.deliveryDate : undefined;

  const result = await postContactEnquiry({
    name, email, phone, country,
    company, companyWebsite, productType, productDescription, quantity, deliveryDate,
  });
  return NextResponse.json(result);
}
