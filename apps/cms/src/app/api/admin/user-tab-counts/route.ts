/**
 * GET /api/admin/user-tab-counts
 *
 * Cached proxy to /get/customers/tab-counts — three cheap COUNT(*)s served
 * from our pg copy. Returns { verified, unverified, carts }. Read-only.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSandboxToken } from "@/lib/sandbox-token";

export const dynamic = "force-dynamic";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8090";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";
const TTL_MS = 30_000;

let cache: { expiresAt: number; body: unknown } | null = null;

export async function GET() {
  if (cache && cache.expiresAt > Date.now()) return NextResponse.json(cache.body);
  if (cache && cache.expiresAt <= Date.now()) cache = null; // sweep expired

  // Gated native aggregate over the CODE_SU customer table: admin token.
  const token = getSandboxToken();
  const headers: Record<string, string> = { "Content-Type": "application/json", Origin: "localhost" };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${BACKEND}/get/customers/tab-counts`, { headers, cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ verified: 0, unverified: 0, carts: 0, error: `Backend ${res.status}` }, { status: res.status });
    }
    const j = (await res.json()) as { verified?: number; unverified?: number; carts?: number };
    const body = { verified: j.verified ?? 0, unverified: j.unverified ?? 0, carts: j.carts ?? 0 };
    cache = { expiresAt: Date.now() + TTL_MS, body };
    return NextResponse.json(body);
  } catch (e) {
    return NextResponse.json({ verified: 0, unverified: 0, carts: 0, error: String(e) }, { status: 500 });
  }
}
