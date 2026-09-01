/**
 * Report CSV download — Weave CMS Reports center.
 *
 * This is a READ that streams a CSV inventory report. Routed entirely through
 * the backend wrapper (:8090) at the SAME path (POST /download/report/{type})
 * instead of fetching LIVE Loom directly — this was the last ungated live
 * Bloomscorp/Loom call in Weave (previously hardcoded LOOM_DIRECT_URL /
 * https://loom-v2.anuprerna.com and bypassed the read-only wrapper + the
 * LOOM_PROXY_ENABLED kill switch entirely). No path in Weave should ever fetch
 * loom-v2.anuprerna.com directly; the wrapper is the ONE place that may reach
 * live Loom, and only when LOOM_PROXY_ENABLED permits it.
 *
 * Auth: SANDBOX_ADMIN_TOKEN (getSandboxToken) — same credential every other
 * admin-gated native wrapper route uses (custom-products-api.ts,
 * order-feedback-api.ts's native cutover, etc). The wrapper's own native
 * download/report/{type} route (CODE_SU-gated) accepts this token directly;
 * it no longer needs a genuine live-signed Loom JWT because the wrapper never
 * leaves the sandbox to serve it.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSandboxToken } from "@/lib/sandbox-token";

export const dynamic = "force-dynamic";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8090";
const VALID_TYPES = new Set(["FABRIC_STOCK", "FINISHED_STOCK"]);

export async function GET(req: NextRequest): Promise<NextResponse> {
  const type = (req.nextUrl.searchParams.get("type") ?? "").toUpperCase();
  const includeDisabled = req.nextUrl.searchParams.get("includeDisabled") === "true";

  if (!VALID_TYPES.has(type)) {
    return NextResponse.json(
      { error: "invalid_type", message: `type must be one of ${[...VALID_TYPES].join(", ")}` },
      { status: 400 },
    );
  }

  const token = getSandboxToken();
  if (!token) {
    return NextResponse.json(
      { error: "no_token", message: "SANDBOX_ADMIN_TOKEN is not set." },
      { status: 502 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND}/download/report/${type}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Origin: "localhost",
      },
      body: JSON.stringify({ includeDisabled }),
      cache: "no-store",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "upstream_unreachable", message: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: "upstream_error", status: upstream.status, message: text.slice(0, 200) },
      { status: 502 },
    );
  }

  const stamp = new Date().toISOString().slice(0, 19).replace(/[^0-9]/g, "");
  const fallbackName = `${type.toLowerCase()}_report_${stamp}.csv`;
  const disposition = upstream.headers.get("content-disposition") ?? `attachment; filename=${fallbackName}`;

  const body = await upstream.arrayBuffer();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
}
