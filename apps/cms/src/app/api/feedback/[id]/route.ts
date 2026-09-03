import { NextRequest, NextResponse } from "next/server";
import { getIdentity, type Identity } from "@/lib/feedback-identity";
import { updateFeedbackStatusInNeon, deleteFeedbackInNeon } from "@/lib/neon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8090";

interface Row {
  id: string;
  submitterEmail?: string;
}

async function findRow(id: string): Promise<Row | null> {
  if (id.startsWith("neon_")) {
    return { id, submitterEmail: "" };
  }
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
  if (me.isOwner || row.id.startsWith("neon_")) return true;
  return (
    !!me.email &&
    (row.submitterEmail ?? "").toLowerCase() === me.email.toLowerCase()
  );
}

// PATCH /api/feedback/:id  { status } | { text, images } | { response }
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const me = await getIdentity();
  if (!me.authenticated) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;

  if (id.startsWith("neon_")) {
    const neonId = parseInt(id.replace("neon_", ""), 10);
    const body = (await req.json().catch(() => ({}))) as { status?: string };
    const status = body.status === "resolved" ? "resolved" : "reviewed";
    const ok = await updateFeedbackStatusInNeon(neonId, status);
    return NextResponse.json({ success: ok });
  }

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

  if (id.startsWith("neon_")) {
    const neonId = parseInt(id.replace("neon_", ""), 10);
    const ok = await deleteFeedbackInNeon(neonId);
    return NextResponse.json({ success: ok });
  }

  const row = await findRow(id);
  if (!row) return NextResponse.json({ success: true });
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
