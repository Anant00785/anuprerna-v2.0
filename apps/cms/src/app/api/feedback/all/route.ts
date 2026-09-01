import { NextResponse } from "next/server";
import { getIdentity } from "@/lib/feedback-identity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8090";

// GET /api/feedback/all -> every feedback row across BOTH apps + caller identity.
// The dashboard needs a cross-app view; the per-page proxy (/api/feedback) is
// hardcoded to app=weave + a single route, so this sibling route fetches both
// app scopes server-side (same identity/auth model) and returns them grouped.
async function listApp(app: string) {
  try {
    const res = await fetch(`${BACKEND}/feedback?app=${app}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { feedback?: unknown[] };
    return data.feedback ?? [];
  } catch {
    return [];
  }
}

export async function GET() {
  const me = await getIdentity();
  const [weave, storefront] = await Promise.all([
    listApp("weave"),
    listApp("storefront"),
  ]);
  return NextResponse.json({ weave, storefront, me });
}
