import { NextRequest, NextResponse } from 'next/server';
import { getIdentity } from '@/lib/feedback-identity';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8090';
const APP = 'storefront';

// GET /api/feedback?route=/foo -> namespace feedback (route + descendants) + the caller identity.
// Fetches ALL feedback for the app from the backend and filters in this proxy
// so the panel count matches the sidebar badge (namespace rule:
// item.route === route || item.route.startsWith(route + '/')).
export async function GET(req: NextRequest) {
  const me = await getIdentity();
  const route = req.nextUrl.searchParams.get('route') ?? '';
  // Fetch all feedback for this app — no route param = backend returns all.
  const url = `${BACKEND}/feedback?app=${APP}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const data = (await res.json().catch(() => ({}))) as { feedback?: Array<{ route: string }> };
    const allItems = data.feedback ?? [];
    // Namespace filter: exact match OR any descendant (same rule as sidebar badge).
    const filtered = route
      ? allItems.filter((item) => {
          const r = item.route ?? '';
          return r === route || r.startsWith(route + '/');
        })
      : allItems;
    return NextResponse.json({ feedback: filtered, me });
  } catch {
    return NextResponse.json({ feedback: [], me });
  }
}

// POST /api/feedback { route, pageLabel, text, images[] }
// Identity (submitterName/Email) is injected server-side from the session.
export async function POST(req: NextRequest) {
  // Guests (no loom_jwt session) file feedback too — Amit tests the storefront in
  // guest / b2c / b2b buyer-modes without logging in. Anon submits as 'Guest'.
  const me = await getIdentity();
  const body = (await req.json().catch(() => ({}))) as {
    route?: string;
    pageLabel?: string;
    text?: string;
    images?: string[];
  };
  const text = (body.text ?? '').trim();
  if (!text) {
    return NextResponse.json({ error: 'Feedback text is required' }, { status: 400 });
  }
  const images = Array.isArray(body.images) ? body.images.slice(0, 2) : [];
  const payload = {
    app: APP,
    route: body.route ?? '',
    pageLabel: body.pageLabel ?? body.route ?? '',
    text,
    images,
    submitterName: me.authenticated ? (me.name || me.email || 'Customer') : 'Guest',
    submitterEmail: me.email || null,
  };
  try {
    const res = await fetch(`${BACKEND}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.ok ? 201 : res.status });
  } catch {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 });
  }
}
