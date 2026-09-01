/**
 * order-feedback-api.ts — SERVER-ONLY typed fetchers for the Order Feedback
 * module (live "Manage Feedbacks" -> Order Feedbacks).
 *
 * Source endpoints (GET, admin surface):
 *   /get/order/feedback-list                    -> { orderFeedbackList: OrderFeedback[] }
 *   /get/super-user/order/feedback/{feedbackId} -> { orderFeedback: OrderFeedback }
 *
 * TRANSPORT (2026-07-04 cutover to native): these are now served NATIVELY by the
 * :8090 wrapper from the sandbox Postgres order_feedback copy — no longer proxied
 * to, nor fetched direct from, LIVE Loom. This RESTORES the read-only wrapper
 * choke point (Weave used to reach past the wrapper straight to live Loom because
 * the un-paginated ~3.2MB/~24s live list 8s-timed-out the read-proxy, costing a
 * ~17s page load). Served from pg the list is sub-second.
 *
 * AUTH: the native routes are admin-gated (auth.matrix.ts CODE_SU) and accept the
 * sandbox admin token, which getServiceToken() returns (SANDBOX_ADMIN_TOKEN).
 *
 * Strictly read-only: there is no non-GET code path anywhere in this module.
 * Every fetcher returns a discriminated Result<T> so a wrapper/DB outage surfaces
 * as an ErrorBanner, never a misleading empty bucket.
 */
import { rewriteBloomscorpUrlsDeep } from "@/lib/media";
import type { Result } from "./result";
import { getServiceToken } from "./loom-service-token";

const BACKEND = (process.env.BACKEND_URL ?? "http://localhost:8090").replace(/\/+$/, "");
const LIST_TIMEOUT_MS = 15000;
const DETAIL_TIMEOUT_MS = 10000;
const LIST_CACHE_TTL_MS = 60000; // native list is sub-second; a short cache avoids re-pulling ~3MB on every navigation

// ── Types ─────────────────────────────────────────────────────────────────────

/** Lean row for the preview table + client bucketing (mirrors the live columns). */
export interface OrderFeedbackRow {
  id: number;
  question1Answer: number;         // Q1 satisfaction 1-10 (0 = unanswered)
  question2: string;               // Q2 prompt ('' = not asked)
  question2Answer: boolean;        // Q2 yes/no
  question2NegativeAnswer: string; // free-text on a 'no'
  question3Answer: string;         // Q3 open comment
  updatedAt: number;
  customerName: string;
  customerEmail: string;
  orderId: number;
}

/** Full record for the detail view (mirrors live OrderFeedback + OrderDetailItem). */
export interface OrderFeedbackDetail {
  id: number;
  question1: string;
  question1Answer: number;
  question2: string;
  question2Answer: boolean;
  question2Negative: string;
  question2NegativeAnswer: string;
  question3: string;
  question3Answer: string;
  createdAt: number;
  updatedAt: number;
  order: {
    id: number;
    total: number;
    subTotal: number;
    shippingCost: number;
    currency: string;
    paymentMode: string;
    createdAt: number;
    couponApplied: boolean;
    couponCode: string;
    couponDiscountAmount: number;
    cancellationReason: string;
    deleted: boolean;
    tenant: { name: string; email: string; contactNumber: string };
  } | null;
}

// ── Fetch helper (server-only, GET-only, through the read-only wrapper) ─────────

async function wrapperGet(path: string, timeoutMs: number): Promise<unknown> {
  const token = await getServiceToken();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "localhost",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`Wrapper returned ${res.status}`);
    return rewriteBloomscorpUrlsDeep(await res.json());
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") throw new Error("Feedback request timed out");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function asRows(data: unknown, ...keys: string[]): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object") {
    for (const k of keys) {
      const v = (data as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v as Record<string, unknown>[];
    }
  }
  return [];
}

function rec(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function mapListRow(r: Record<string, unknown>): OrderFeedbackRow {
  const order = rec(r.order);
  const tenant = rec(order.tenant);
  return {
    id: Number(r.id ?? 0),
    question1Answer: Number(r.question1Answer ?? 0),
    question2: String(r.question2 ?? ""),
    question2Answer: Boolean(r.question2Answer),
    question2NegativeAnswer: String(r.question2NegativeAnswer ?? ""),
    question3Answer: String(r.question3Answer ?? ""),
    updatedAt: Number(r.updatedAt ?? 0),
    customerName: String(tenant.name ?? ""),
    customerEmail: String(tenant.email ?? ""),
    orderId: Number(order.id ?? 0),
  };
}

function mapDetail(data: unknown): OrderFeedbackDetail | null {
  const d = rec(rec(data).orderFeedback ?? data);
  if (!d || d.id == null) return null;
  const o = rec(d.order);
  const hasOrder = o && o.id != null;
  const t = rec(o.tenant);
  return {
    id: Number(d.id ?? 0),
    question1: String(d.question1 ?? ""),
    question1Answer: Number(d.question1Answer ?? 0),
    question2: String(d.question2 ?? ""),
    question2Answer: Boolean(d.question2Answer),
    question2Negative: String(d.question2Negative ?? ""),
    question2NegativeAnswer: String(d.question2NegativeAnswer ?? ""),
    question3: String(d.question3 ?? ""),
    question3Answer: String(d.question3Answer ?? ""),
    createdAt: Number(d.createdAt ?? 0),
    updatedAt: Number(d.updatedAt ?? 0),
    order: hasOrder
      ? {
          id: Number(o.id ?? 0),
          total: Number(o.total ?? 0),
          subTotal: Number(o.subTotal ?? 0),
          shippingCost: Number(o.shippingCost ?? 0),
          currency: String(o.currency ?? ""),
          paymentMode: String(o.paymentMode ?? ""),
          createdAt: Number(o.createdAt ?? 0),
          couponApplied: Boolean(o.couponApplied),
          couponCode: String(o.couponCode ?? ""),
          couponDiscountAmount: Number(o.couponDiscountAmount ?? 0),
          cancellationReason: String(o.cancellationReason ?? ""),
          deleted: Boolean(o.deleted),
          tenant: {
            name: String(t.name ?? ""),
            email: String(t.email ?? ""),
            contactNumber: String(t.contactNumber ?? ""),
          },
        }
      : null,
  };
}

// ── Fetchers ───────────────────────────────────────────────────────────────────

let _listCache: { rows: OrderFeedbackRow[]; expiresAt: number } | null = null;

/** Full preview list, newest first (mirrors live sort by updatedAt desc). */
export async function fetchOrderFeedbackList(): Promise<Result<OrderFeedbackRow[]>> {
  if (_listCache && Date.now() < _listCache.expiresAt) {
    return { ok: true, data: _listCache.rows };
  }
  try {
    const data = await wrapperGet("/get/order/feedback-list", LIST_TIMEOUT_MS);
    const rows = asRows(data, "orderFeedbackList", "list")
      .map(mapListRow)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    _listCache = { rows, expiresAt: Date.now() + LIST_CACHE_TTL_MS };
    return { ok: true, data: rows };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Single feedback record for the detail view. */
export async function fetchOrderFeedbackById(id: string | number): Promise<Result<OrderFeedbackDetail | null>> {
  const clean = String(id).replace(/[^0-9]/g, "");
  if (!clean) return { ok: true, data: null };
  try {
    const data = await wrapperGet("/get/super-user/order/feedback/" + clean, DETAIL_TIMEOUT_MS);
    return { ok: true, data: mapDetail(data) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
