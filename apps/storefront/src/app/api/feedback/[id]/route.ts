import { NextRequest, NextResponse } from 'next/server';
import { getIdentity, type Identity } from '@/lib/feedback-identity';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8090';
const APP = 'storefront';

interface Row {
  id: string;
  submitterEmail?: string;
}

// The backend has no GET-by-id; list this app's rows and find it, so we can
// authorize (submitter OR owner) before mutating.
async function findRow(id: string): Promise<Row | null> {
  try {
    const res = await fetch(`${BACKEND}/feedback?app=${APP}`, { cache: 'no-store' });
    const data = (await res.json().catch(() => ({}))) as { feedback?: Row[] };
    return (data.feedback ?? []).find((r) => r.id === id) ?? null;
  } catch {
    return null;
  }
}

function canModify(me: Identity, row: Row): boolean {
  if (me.isOwner) return true;
  return (
    !!me.email &&
    (row.submitterEmail ?? '').toLowerCase() === me.email.toLowerCase()
  );
}

// PATCH /api/feedback/:id { status } | { text, images }
// Status-only patches (resolve) are allowed for any panel viewer — the feedback
// widget is only mounted when NEXT_PUBLIC_FEEDBACK_ENABLED=true (local :3000 only),
// so this is Amit's QA tool. Mirrors how POST is open to guests.
// Text/image edits still require authentication + ownership.
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const me = await getIdentity();
  const { id } = await ctx.params;

  const body = (await req.json().catch(() => ({}))) as {
    status?: string;
    text?: string;
    images?: string[];
  };

  // Determine intent: status-only = resolve; anything with text = edit
  const isStatusOnly = typeof body.status === 'string' && typeof body.text !== 'string';

  if (!isStatusOnly) {
    // Edit requires authentication + ownership
    if (!me.authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const row = await findRow(id);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!canModify(me, row)) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }
  }

  const forward: Record<string, unknown> = {};
  if (typeof body.status === 'string') forward.status = body.status;
  if (typeof body.text === 'string') {
    forward.text = body.text.trim();
    forward.images = Array.isArray(body.images) ? body.images.slice(0, 2) : [];
  }

  try {
    const res = await fetch(`${BACKEND}/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forward),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 });
  }
}

// DELETE /api/feedback/:id
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const me = await getIdentity();
  if (!me.authenticated) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const row = await findRow(id);
  if (!row) return NextResponse.json({ success: true }); // already gone
  if (!canModify(me, row)) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }
  try {
    const res = await fetch(`${BACKEND}/feedback/${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 });
  }
}
