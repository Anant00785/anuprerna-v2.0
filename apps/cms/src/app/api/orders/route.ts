/**
 * GET /api/orders
 *
 * Paginated, server-side-searchable order list.
 *
 * The underlying Loom dump is large (~33 MB, ~46 s). This route fetches it
 * once, caches the normalised rows in process for 5 minutes, then returns
 * only the requested page slice — so the browser receives ~KB not ~MB.
 *
 * Query params:
 *   page  (default 1)   — 1-based page number
 *   size  (default 50)  — rows per page (capped at 200)
 *   q     (default "")  — search string matched against order id, customer name, zoho id
 *
 * Response: { orders: OrderRow[], total: number, page: number, size: number }
 *
 * Read-only — no writes to Loom.
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrderList } from "@/lib/api";
import { getSandboxToken } from "@/lib/sandbox-token";
import type { OrderRow } from "@/lib/api";

// ── In-process cache (module-level; survives across requests in one worker) ──

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: OrderRow[];
  expiresAt: number;
}

let orderCache: CacheEntry | null = null;

async function getCachedOrders(token?: string): Promise<OrderRow[]> {
  const now = Date.now();
  if (orderCache && orderCache.expiresAt > now) {
    return orderCache.data;
  }
  const data = await getOrderList(token);
  orderCache = { data, expiresAt: now + CACHE_TTL_MS };
  return data;
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = getSandboxToken();

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const size = Math.min(200, Math.max(1, Number(searchParams.get("size") ?? "50")));
  const q = (searchParams.get("q") ?? "").toLowerCase().trim();
  const status = (searchParams.get("status") ?? "").toUpperCase().trim();

  try {
    const all = await getCachedOrders(token);

    // Global search first (matches live: search spans every status); the status
    // tab is a post-filter on top. Per-status counts + the overdue tally are
    // computed over the search-filtered set BEFORE the status filter and BEFORE
    // pagination, so every tab badge and the stats strip show REAL totals across
    // all ~2.6k cached orders — not just the current 50-row page. Cost is a
    // single in-memory pass over the already-cached dump (no extra fetch, and
    // the browser still receives only the 50-row slice).
    const searched = q
      ? all.filter(
          (o) =>
            String(o.id).includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            (o.zohoOrderId ?? "").toLowerCase().includes(q),
        )
      : all;

    const counts: Record<string, number> = {};
    let overdue = 0;
    for (const o of searched) {
      counts[o.overallStatus] = (counts[o.overallStatus] ?? 0) + 1;
      if (o.isOverdue) overdue++;
    }

    const statusFiltered = status
      ? searched.filter((o) => o.overallStatus === status)
      : searched;

    const total = statusFiltered.length;
    const start = (page - 1) * size;
    const orders = statusFiltered.slice(start, start + size);

    return NextResponse.json({ orders, total, page, size, counts, overdue });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
