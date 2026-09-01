/**
 * GET /api/admin/carts
 *
 * Cached proxy to the paginated native wrapper endpoint
 * (/get/tenant/cart-item/list). Returns { rows, total }. Read-only.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSandboxToken } from "@/lib/sandbox-token";
import { rewriteBloomscorpUrlsDeep } from "@/lib/media";

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

  const now = Date.now();
  for (const [k, v] of cache) if (v.expiresAt <= now) cache.delete(k); // sweep expired
  const key = `carts|${pageNumber}|${pageSize}|${search}`;
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return NextResponse.json(hit.body);

  // Gated native endpoint (cart-item/list is CODE_SU in Loom): admin token.
  const token = getSandboxToken();
  const headers: Record<string, string> = { "Content-Type": "application/json", Origin: "localhost" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url =
    `${BACKEND}/get/tenant/cart-item/list?pageNumber=${encodeURIComponent(pageNumber)}` +
    `&pageSize=${encodeURIComponent(pageSize)}&search=${encodeURIComponent(search)}`;

  try {
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ rows: [], total: 0, error: `Backend ${res.status}` }, { status: res.status });
    }
    const j = rewriteBloomscorpUrlsDeep(await res.json()) as { cartOverview?: unknown[]; totalCount?: number };
    const body = { rows: j.cartOverview ?? [], total: j.totalCount ?? 0 };
    cache.set(key, { expiresAt: Date.now() + TTL_MS, body });
    return NextResponse.json(body);
  } catch (e) {
    return NextResponse.json({ rows: [], total: 0, error: String(e) }, { status: 500 });
  }
}
