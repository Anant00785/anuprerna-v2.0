/**
 * GET /artisanflow/api/custom-orders/search
 *
 * Lightweight search over custom orders, for pickers (e.g. StartJobDialog's
 * order combobox) that need to search normal AND custom orders together.
 * Mirrors /api/orders' in-process cache-then-filter pattern, but backed by
 * getCustomOrderList (super-user/custom-order-list) instead of the order
 * data-dump. Read-only.
 *
 * Query params:
 *   q     (default "")  — matched against id, name, email
 *   size  (default 20)  — rows returned (capped at 50)
 *
 * CACHE SCOPING. Unlike /api/orders — which fetches with the single server-held
 * SANDBOX_ADMIN_TOKEN, so one cached copy is by definition the same for every
 * caller — this route fetches with the CALLER'S weave_token cookie when it has
 * one. A single unkeyed module-level cache therefore served rows fetched under
 * one user's credentials to the next user for up to 5 minutes. The cache is now
 * keyed by a hash of the exact token the fetch was made with, so a cached entry
 * can only ever be replayed to a caller holding that same credential. The token
 * is hashed rather than used raw so the secret is not retained as a map key.
 *
 * VERCEL PARITY (rule R3 — module-level mutable state). This map is a
 * BEST-EFFORT optimisation only, never a correctness dependency: the upstream
 * call costs ~2–3.6 s, which is too slow to repeat on every keystroke of a
 * type-ahead. On serverless each invocation may get a fresh module, in which
 * case the map is simply empty and the route does the full fetch — slower, same
 * answer. Nothing reads through it for correctness, and it is bounded so a long
 * -lived process cannot accumulate one entry per user forever.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { getServiceToken } from "@/lib/loom-service-token";
import { getCustomOrderList, type CustomOrderPreview } from "@/lib/artisanflow-api";

export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";
const CACHE_TTL_MS = 5 * 60 * 1000;
/** Hard cap on distinct credentials held at once; oldest entry is evicted. */
const CACHE_MAX_ENTRIES = 16;

const cache = new Map<string, { data: CustomOrderPreview[]; expiresAt: number }>();

function cacheKey(token?: string): string {
  return createHash("sha256").update(token ?? "anonymous").digest("hex");
}

async function getCachedCustomOrders(token?: string): Promise<CustomOrderPreview[]> {
  const now = Date.now();
  const key = cacheKey(token);
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.data;

  const data = await getCustomOrderList({ pageSize: 300 }, token);

  // Drop anything already expired, then evict oldest-first if still at the cap.
  for (const [k, v] of cache) if (v.expiresAt <= now) cache.delete(k);
  while (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next();
    if (oldest.done) break;
    cache.delete(oldest.value);
  }
  cache.set(key, { data, expiresAt: now + CACHE_TTL_MS });
  return data;
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? (await getServiceToken());

  const { searchParams } = req.nextUrl;
  const q = (searchParams.get("q") ?? "").toLowerCase().trim();
  const size = Math.min(50, Math.max(1, Number(searchParams.get("size") ?? "20")));

  try {
    const all = await getCachedCustomOrders(token);
    const matched = q
      ? all.filter(
          (o) =>
            String(o.id).includes(q) ||
            (o.name || "").toLowerCase().includes(q) ||
            (o.email || "").toLowerCase().includes(q),
        )
      : all;
    return NextResponse.json({ orders: matched.slice(0, size) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
