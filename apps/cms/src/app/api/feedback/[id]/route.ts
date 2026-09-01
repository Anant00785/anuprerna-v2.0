import { NextRequest, NextResponse } from "next/server";
import { getIdentity, type Identity } from "@/lib/feedback-identity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8090";

interface Row {
  id: string;
  submitterEmail?: string;
}

// The backend has no GET-by-id; list rows and find it, so we can authorize
// (submitter OR owner) before mutating — mirrors the assistance app. We search
// BOTH app scopes (weave + storefront) so the cross-app Feedback dashboard can
// moderate storefront rows too; the widget only ever touches weave rows, which
// are still found the same way, so this is backward-compatible.
async function findRow(id: string): Promise<Row | null> {
  for (const app of ["weave", "storefront"]) {
    try {
      const res = await fetch(`${BACKEND}/feedback?app=${app}`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { feedback?: Row[] };
      const hit = (data.feedback ?? []).find((r) => r.id === id);
      if (hit) return hit;
    } catch {
      /* try next app scope */
    }
  }
  return null;
}

function canModify(me: Identity, row: Row): boolean {
  if (me.isOwner) return true;
  return (
    !!me.email &&
    (row.submitterEmail ?? "").toLowerCase() === me.email.toLowerCase()
  );
}

// PATCH /api/feedback/:id  { status } | { text, images } | { response }
// `response` (the Claude/admin reply) is forwarded in EITHER branch so a
// { status, response } PATCH sets both at once — the backend already supports
// this; the proxy used to silently drop it.
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const me = await getIdentity();
  if (!me.authenticated) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const row = await findRow(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canModify(me, row)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    status?: string;
    text?: string;
    images?: string[];
    response?: string | null;
  };
  const forward: Record<string, unknown> = {};
  if (typeof body.status === "string") forward.status = body.status;
  if (typeof body.text === "string") {
    forward.text = body.text.trim();
    forward.images = Array.isArray(body.images) ? body.images.slice(0, 2) : [];
  }
  // response is nullable free text; forward it whenever the caller sent the key
  // (string sets it, null clears it) regardless of the status/text branch.
  if (typeof body.response === "string" || body.response === null) {
    forward.response = body.response;
  }

  try {
    const res = await fetch(`${BACKEND}/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forward),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}

// DELETE /api/feedback/:id
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const me = await getIdentity();
  if (!me.authenticated) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const row = await findRow(id);
  if (!row) return NextResponse.json({ success: true }); // already gone
  if (!canModify(me, row)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  try {
    const res = await fetch(`${BACKEND}/feedback/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}
