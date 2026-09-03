import { NextResponse } from "next/server";
import { getIdentity } from "@/lib/feedback-identity";
import { getFeedbacksFromNeon } from "@/lib/neon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:3000";

async function listApp(app: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${BACKEND}/feedback?app=${app}`, {
      cache: "no-store",
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const data = (await res.json().catch(() => ({}))) as { feedback?: unknown[] };
    return data.feedback ?? [];
  } catch {
    return [];
  }
}

export async function GET() {
  const me = await getIdentity();
  const [weave, storefrontLegacy, neonRows] = await Promise.all([
    listApp("weave"),
    listApp("storefront"),
    getFeedbacksFromNeon(100),
  ]);

  // Map Neon Postgres customer feedbacks into standard FeedbackRow shape
  const neonFormatted = (neonRows || []).map((r) => ({
    id: `neon_${r.id}`,
    app: "storefront" as const,
    route: r.page_url || "/",
    pageLabel: r.page_title
      ? `${r.page_title} • ${(r.category || 'general').toUpperCase()}`
      : `Customer Feedback • ${(r.category || 'general').toUpperCase()}`,
    text: `⭐ Rating: ${r.rating || 5}/5 Stars (${r.category || 'general'})\n\n${r.message}`,
    images: r.image_url ? [r.image_url] : [],
    submitterName: r.name || "Customer",
    submitterEmail: r.email || "",
    status:
      r.status === "resolved"
        ? ("resolved" as const)
        : r.status === "reviewed"
        ? ("claude_done" as const)
        : ("pending" as const),
    createdAt: r.created_at
      ? new Date(r.created_at).toISOString()
      : new Date().toISOString(),
    updatedAt: r.created_at
      ? new Date(r.created_at).toISOString()
      : new Date().toISOString(),
  }));

  const storefront = [...neonFormatted, ...(storefrontLegacy as typeof neonFormatted)];

  return NextResponse.json({ weave, storefront, me });
}
