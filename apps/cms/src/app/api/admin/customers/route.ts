/**
 * GET /api/admin/customers
 *
 * Thin, cached proxy to the paginated native wrapper endpoint
 * (/get/customers). Attaches the Loom token server-side, forwards
 * pageNumber/pageSize/search/verified, and returns a uniform { rows, total }
 * so usePaginatedList stays endpoint-agnostic.
 *
 * Read-only. A short in-process cache (20s) makes re-visiting a page instant.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSandboxToken } from "@/lib/sandbox-token";

export const dynamic = "force-dynamic";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8090";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";
const TTL_MS = 20_000;

interface Entry {
  expiresAt: number;
  body: { rows: unknown[]; total: number };
}
const cache = new Map<string, Entry>();

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const pageNumber = sp.get("pageNumber") ?? "0";
  const pageSize = sp.get("pageSize") ?? "25";
  const search = sp.get("search") ?? "";
  const verified = sp.get("verified") === "true" ? "true" : "false";

  const now = Date.now();
  for (const [k, v] of cache) if (v.expiresAt <= now) cache.delete(k); // sweep expired
  const key = `customers|${pageNumber}|${pageSize}|${search}|${verified}`;
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return NextResponse.json(hit.body);

  // Gated native endpoint (/get/customers is CODE_SU in Loom): attach the
  // wrapper admin token server-side. User auth already enforced by middleware.
  const token = getSandboxToken();
  const headers: Record<string, string> = { "Content-Type": "application/json", Origin: "localhost" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url =
    `${BACKEND}/get/customers?pageNumber=${encodeURIComponent(pageNumber)}` +
    `&pageSize=${encodeURIComponent(pageSize)}` +
    `&search=${encodeURIComponent(search)}&verified=${verified}`;

  try {
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ rows: [], total: 0, error: `Backend ${res.status}` }, { status: res.status });
    }
    const j = (await res.json()) as { customerList?: unknown[]; totalCount?: number };
    const body = { rows: j.customerList ?? [], total: j.totalCount ?? 0 };
    cache.set(key, { expiresAt: Date.now() + TTL_MS, body });
    return NextResponse.json(body);
  } catch (e) {
    return NextResponse.json({ rows: [], total: 0, error: String(e) }, { status: 500 });
  }
}
