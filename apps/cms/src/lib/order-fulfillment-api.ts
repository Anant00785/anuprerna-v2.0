/**
 * order-fulfillment-api.ts — SERVER-ONLY typed fetchers for a REGULAR order's
 * fulfillment history (live "Manage Order -> Order Detail" overview).
 *
 * Live source endpoints (GET, role CODE_SU):
 *   /get/super-user/order/{orderId}/fulfillment-list -> { orderFulfillmentList: OrderFulfillment[] }
 *   /get/super-user/order/{orderId}/ready-list       -> { orderReadyList:       OrderReady[] }
 *
 * AUTH / TRANSPORT: the :8090 wrapper transparently proxies these two paths to
 * LIVE Loom and forwards the caller's bearer. The browser session cookie is the
 * SANDBOX admin token, which live Loom rejects ("credentials have been tampered
 * with"), so — exactly like order-feedback-api — these reads MUST run
 * server-side with a genuine live-Loom service token (getLiveLoomToken). Both
 * payloads are small and fast, so we go through the read-proxy (:8090), keeping
 * the single GET-only seam. Strictly read-only: no non-GET code path exists here.
 *
 * Every fetcher returns a discriminated Result<T> so a Loom outage surfaces as an
 * ErrorBanner, never a misleading empty "nothing shipped" state.
 */
import { rewriteBloomscorpUrlsDeep } from "@/lib/media";
import type { Result } from "./result";
import { getServiceToken } from "./loom-service-token";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8090";
const TIMEOUT_MS = 12000;

// ── Types (only the fields the order-detail fulfilment surface consumes) ──────

export interface OrderItemFulfillment {
  orderItemId: number;
  quantity: number;
  unit: string;
}

export interface OrderFulfillment {
  id: number;
  shippingCode?: string;
  trackingUrl?: string;
  zohoPackageId?: string;
  dispatchedOn?: number;
  note?: string;
  orderItemFulfillmentList: OrderItemFulfillment[];
}

export interface OrderItemReady {
  orderItemId: number;
  quantity: number;
  unit: string;
}

export interface OrderReady {
  id: number;
  receivedDate?: number;
  note?: string;
  orderItemReadyList: OrderItemReady[];
}

// ── Fetch helper (server-only, GET-only, live-token, via :8090 read-proxy) ────

async function loomGet(path: string): Promise<unknown> {
  const token = await getServiceToken();
  if (!token) throw new Error("Loom service token unavailable");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", Origin: "localhost", Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`Loom returned ${res.status}`);
    return rewriteBloomscorpUrlsDeep(await res.json());
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") throw new Error("Loom request timed out");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function pickArray(payload: unknown, ...keys: string[]): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const k of keys) if (Array.isArray(obj[k])) return obj[k] as Record<string, unknown>[];
  }
  return [];
}

function rec(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function mapFulfillmentItem(r: Record<string, unknown>): OrderItemFulfillment {
  return {
    orderItemId: Number(r.orderItemId ?? 0),
    quantity: Number(r.quantity ?? 0),
    unit: String(r.unit ?? ""),
  };
}

function mapFulfillment(r: Record<string, unknown>): OrderFulfillment {
  return {
    id: Number(r.id ?? 0),
    shippingCode: String(r.shippingCode ?? ""),
    trackingUrl: String(r.trackingUrl ?? ""),
    zohoPackageId: String(r.zohoPackageId ?? ""),
    dispatchedOn: Number(r.dispatchedOn ?? 0),
    note: String(r.note ?? ""),
    orderItemFulfillmentList: pickArray(r.orderItemFulfillmentList).map(mapFulfillmentItem),
  };
}

function mapReadyItem(r: Record<string, unknown>): OrderItemReady {
  return {
    orderItemId: Number(r.orderItemId ?? 0),
    quantity: Number(r.quantity ?? 0),
    unit: String(r.unit ?? ""),
  };
}

function mapReady(r: Record<string, unknown>): OrderReady {
  return {
    id: Number(r.id ?? 0),
    receivedDate: Number(r.receivedDate ?? 0),
    note: String(r.note ?? ""),
    orderItemReadyList: pickArray(r.orderItemReadyList).map(mapReadyItem),
  };
}

// ── Fetchers ──────────────────────────────────────────────────────────────────

/** Shipment (fulfillment) records for one order. Newest-id first is not
 *  guaranteed by Loom; we preserve server order (live renders as-returned). */
export async function getOrderFulfillmentList(orderId: number): Promise<Result<OrderFulfillment[]>> {
  try {
    const data = await loomGet(`/get/super-user/order/${orderId}/fulfillment-list`);
    return { ok: true, data: pickArray(data, "orderFulfillmentList").map(mapFulfillment) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Partial-ready records for one order (items marked ready before shipment). */
export async function getOrderReadyList(orderId: number): Promise<Result<OrderReady[]>> {
  try {
    const data = await loomGet(`/get/super-user/order/${orderId}/ready-list`);
    return { ok: true, data: pickArray(data, "orderReadyList").map(mapReady) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
