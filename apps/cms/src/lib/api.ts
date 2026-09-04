/**
 * Weave backend API client.
 * Points at our NestJS wrapper (:8090) which proxies Loom reads
 * and serves by-id + preview-list routes from our Postgres.
 *
 * Server-side: pass token directly (read from cookie in calling code).
 * Client-side: call Next.js /api/* routes that attach the token.
 */

import { rewriteBloomscorpUrlsDeep } from "@/lib/media";
import { getRecentDbOrders, getDbOrderDetail } from "./db-orders";
import type { ListingRow, ListingStatus } from "./types";
import type {
  ProductEnvelope,
  ProductType,
  RefOption,
  ReferenceData,
  LoadedProduct,
} from "@/types/product";

const BACKEND =
  typeof window === "undefined"
    ? (process.env.BACKEND_URL ?? "http://localhost:8090")
    : (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8090");

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly path: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Origin: "localhost",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BACKEND}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, `Backend ${res.status}: ${text.slice(0, 200)}`, path);
  }

  return rewriteBloomscorpUrlsDeep(await res.json()) as T;
}

export async function getFabricPreviewList(token?: string) {
  return request<{ success: boolean; productPreviewList: unknown[] }>(
    "/get/fabric-preview-list",
    {},
    token,
  );
}

export async function getFinishedPreviewList(token?: string) {
  return request<{ success: boolean; productPreviewList: unknown[] }>(
    "/get/finished-preview-list",
    {},
    token,
  );
}

export async function getFabricProduct(id: number, token?: string) {
  return request<{ success: boolean; fabricProduct: unknown }>(
    `/get/fabric-product/${id}`,
    {},
    token,
  );
}

export async function getFinishedProduct(id: number, token?: string) {
  return request<{ success: boolean; finishedProduct: unknown }>(
    `/get/finished-product/${id}`,
    {},
    token,
  );
}

// ── Raw backend preview row shape ─────────────────────────────────────────

interface RawPreviewCategory {
  id: number;
  name: string;
}

interface RawPreviewProduct {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  totalQuantity: number;
  heroImage?: string;
  category?: RawPreviewCategory;
  subCategory?: RawPreviewCategory;
  mainProductCheck: boolean;
  disabled?: boolean;
}

interface RawPreviewItem {
  id: number;
  version: number;
  gsm?: number;
  product: RawPreviewProduct;
}

function deriveStatus(p: RawPreviewProduct): ListingStatus {
  if (p.disabled) return "INACTIVE";
  if (p.mainProductCheck) return "ACTIVE";
  return "DRAFT";
}

function normalizeRow(raw: RawPreviewItem, productType: "fabric" | "finished"): ListingRow {
  const p = raw.product;
  return {
    id: raw.id,
    productId: p.id,
    name: p.name,
    sku: p.sku,
    price: p.price,
    quantity: p.quantity,
    totalQuantity: p.totalQuantity,
    heroImage: p.heroImage ?? "",
    category: p.category?.name ?? "",
    subCategory: p.subCategory?.name ?? "",
    status: deriveStatus(p),
    productType,
  };
}

/**
 * Fetch and normalize both fabric and finished preview lists into a single
 * flat array of ListingRow. Runs both fetches in parallel.
 *
 * Payload note: raw responses are ~23 MB (fabric) + ~14 MB (finished) = ~37 MB
 * backend traffic (localhost). Normalized output is ~800 KB (4063 lean rows).
 * Phase C should add server-side pagination to this endpoint.
 */
export async function getListings(token?: string): Promise<ListingRow[]> {
  const [fabricRes, finishedRes] = await Promise.all([
    getFabricPreviewList(token),
    getFinishedPreviewList(token),
  ]);

  const fabricRows = (fabricRes.productPreviewList as RawPreviewItem[]).map((r) =>
    normalizeRow(r, "fabric"),
  );
  const finishedRows = (finishedRes.productPreviewList as RawPreviewItem[]).map((r) =>
    normalizeRow(r, "finished"),
  );

  return [...fabricRows, ...finishedRows];
}

// ════════════════════════════════════════════════════════════════════════
// Phase C — Product edit form: typed product fetch + reference dropdowns
// ════════════════════════════════════════════════════════════════════════


interface RawEnvelope {
  success: boolean;
  message?: string;
  fabricProduct?: Record<string, unknown>;
  finishedProduct?: Record<string, unknown>;
}

function toFabricEnvelope(raw: Record<string, unknown>): ProductEnvelope {
  return {
    type: "fabric",
    id: Number(raw.id ?? 0),
    version: Number(raw.version ?? 0),
    gsm: raw.gsm as number | undefined,
    addToSwatch: raw.addToSwatch as boolean | undefined,
    width: raw.width as string | undefined,
    product: (raw.product ?? {}) as LoadedProduct,
  };
}

function toFinishedEnvelope(raw: Record<string, unknown>): ProductEnvelope {
  return {
    type: "finished",
    id: Number(raw.id ?? 0),
    version: Number(raw.version ?? 0),
    product: (raw.product ?? {}) as LoadedProduct,
  };
}

/**
 * Fetch a single product envelope by its preview-record id.
 * When `type` is omitted, tries fabric first then finished (fabric/finished
 * id sequences are independent and may collide — pass `type` for certainty).
 */
export async function getProduct(
  id: number,
  type?: ProductType,
  token?: string,
): Promise<ProductEnvelope | null> {
  const order: ProductType[] = type ? [type] : ["fabric", "finished"];
  for (const t of order) {
    const path = t === "fabric"
      ? `/get/fabric-product/${id}`
      : `/get/finished-product/${id}`;
    try {
      const raw = await request<RawEnvelope>(path, {}, token);
      if (raw.success && t === "fabric" && raw.fabricProduct) {
        return toFabricEnvelope(raw.fabricProduct);
      }
      if (raw.success && t === "finished" && raw.finishedProduct) {
        return toFinishedEnvelope(raw.finishedProduct);
      }
    } catch {
      // try next family
    }
  }
  return null;
}

// ── Reference dropdown lists (proxied to live Loom — need a bearer token) ───
// Loom wraps lists as { success, message, <key>: [...] }. We extract the first
// array of {id,name}-shaped objects so we are resilient to the key name.

function extractRefList(payload: unknown): RefOption[] {
  if (!payload || typeof payload !== "object") return [];
  for (const value of Object.values(payload as Record<string, unknown>)) {
    if (Array.isArray(value) && value.length && typeof value[0] === "object") {
      const first = value[0] as Record<string, unknown>;
      if ("id" in first && "name" in first) {
        return (value as Record<string, unknown>[]).map((o) => ({
          id: Number(o.id),
          name: String(o.name ?? ""),
        }));
      }
    }
  }
  return [];
}

async function fetchRefList(path: string, token?: string): Promise<RefOption[]> {
  try {
    const payload = await request<unknown>(path, {}, token);
    return extractRefList(payload);
  } catch {
    return [];
  }
}

export const getCategories = (token?: string) =>
  fetchRefList("/get/category-list", token);
export const getSegments = (token?: string) =>
  fetchRefList("/get/segment-list", token);
export const getSubCategories = (token?: string) =>
  fetchRefList("/get/sub-category-list", token);
export const getSkuGroups = (token?: string) =>
  fetchRefList("/get/sku-group-list", token);
export const getMaterials = (token?: string) =>
  fetchRefList("/get/material-list", token);
export const getColors = (token?: string) =>
  fetchRefList("/get/color-list", token);
export const getPatterns = (token?: string) =>
  fetchRefList("/get/pattern-list", token);
export const getTags = (token?: string) =>
  fetchRefList("/get/tag-list", token);
export const getSpecialStatuses = (token?: string) =>
  fetchRefList("/get/special-status-list", token);

/**
 * Searchable "Main Product" / fabric selector options.
 * Built from the token-free preview lists (no auth needed) so the selector
 * works even in build mode. Returns lean {id, sku} rows.
 */
export async function getProducts(
  token?: string,
): Promise<{ id: number; sku: string }[]> {
  try {
    const rows = await getListings(token);
    return rows.map((r) => ({ id: r.id, sku: r.sku }));
  } catch {
    return [];
  }
}

/**
 * Load every reference list the form needs in parallel (best-effort).
 * Reference lists are token-gated; on a miss they come back empty and the
 * form falls back to seeding selects from the product's own embedded objects.
 * `authenticated` flips true when at least categories resolved.
 */
export async function loadReferenceData(token?: string): Promise<ReferenceData> {
  const [
    categories, segments, subCategories, skuGroups,
    materials, colors, patterns, tags, specialStatuses,
    products,
  ] = await Promise.all([
    getCategories(token),
    getSegments(token),
    getSubCategories(token),
    getSkuGroups(token),
    getMaterials(token),
    getColors(token),
    getPatterns(token),
    getTags(token),
    getSpecialStatuses(token),
    // The Main Product / Made-to-Order Fabric selectors both need the real
    // catalog (previously hardcoded to [], which left "Select Made To Order
    // Fabric" showing no options even when a fabric was already linked).
    // getProducts() is the lean {id, sku} projection built for exactly this.
    getProducts(token),
  ]);
  return {
    categories, segments, subCategories, skuGroups,
    materials, colors, patterns, tags, specialStatuses,
    products,
    authenticated: categories.length > 0,
  };
}

// ════════════════════════════════════════════════════════════════════════
// Commerce — Orders
// ════════════════════════════════════════════════════════════════════════

/** Lean order row for the list view — normalized from the full dump. */
export interface OrderRow {
  id: number;
  customerName: string;
  total: number;
  currency: string;
  itemCount: number;
  createdAt: number;
  overallStatus: string;
  paymentStatus: string;
  paymentMode: string;
  zohoOrderId: string;
  loyaltyOrder: boolean;
  deleted: boolean;
  // -- Row badges + fulfilment progress (derived from orderItems in the dump) --
  // Mirrors live OrderPreviewItem's server-computed flags so the orders list can
  // restore the swatch / wholesale / made-to-order / pre-order badges, the
  // per-row fulfilment progress bar, and the overdue indicator.
  hasSwatchItems: boolean;
  hasMadeToOrderItems: boolean;
  hasPreOrderItems: boolean;
  productType: string; // "FINISHED" | "FABRIC" | "MIXED" | ""
  isOverdue: boolean;
  processingItemCount: number;
  readyItemCount: number;
  dispatchedItemCount: number;
  cancelledItemCount: number;
  estimatedDeliveryFrom: number;
  estimatedDeliveryTo: number;
}

export interface OrderAddress {
  name: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  addressLineOne?: string;
  contactEmail?: string;
  primaryPhone?: string;
}

export interface OrderItemRow {
  id: number;
  orderId: number;
  productName: string;
  sku: string;
  productGroup: string;
  orderType: string;
  quantity: number;
  unit: string;
  price: number;
  currency: string;
  orderStatus: string;
  paymentStatus: string;
  dispatchedOn: number;
  estimatedDeliveryFrom: number;
  estimatedDeliveryTo: number;
  trackingUrl: string;
  shippingCode: string;
  zohoPackageId: string;
}

export interface OrderDetail {
  id: number;
  version: number;
  customerName: string;
  subTotal: number;
  shippingCost: number;
  total: number;
  currency: string;
  advancePay: number;
  remainingPay: number;
  autoDiscount: number;
  couponApplied: boolean;
  couponCode: string;
  couponDiscount: number;
  couponDiscountAmount: number;
  loyaltyOrder: boolean;
  loyaltyDiscount: number;
  loyaltyDiscountAmount: number;
  note: string;
  globalNote: string;
  zohoOrderId: string;
  paymentMode: string;
  exchangeRate: number;
  createdAt: number;
  deleted: boolean;
  cancellationReason: string;
  shippingAddress?: OrderAddress;
  billingAddress?: OrderAddress;
  items: OrderItemRow[];
  transactions: Array<{ id: number; amount: number; currency: string; status: string; transactionId: string; createdAt: string }>;
}

// ── Private helpers ─────────────────────────────────────────────────────────

// Order-level status derived from item rows, replicating Loom's server-side
// order-list CASE exactly (backend orders.repository.ts adminOrderPreviews).
// Verified 0 mismatches vs /get/super-user/order-list across all 2645 orders.
// Only canonical OrderStatus literals are ever returned.
export function deriveOrderStatus(
  items: Array<{ orderStatus?: string; trackingUrl?: string }>,
): string {
  if (!items?.length) return "INITIATED";
  const itemCount = items.length;
  let cancelled = 0, failed = 0, initiated = 0, partial = 0, tracked = 0;
  for (const it of items) {
    switch ((it.orderStatus ?? "").toUpperCase()) {
      case "CANCELLED": cancelled++; break;
      case "FAILED": failed++; break;
      case "INITIATED": initiated++; break;
      case "PARTIALLY_DISPATCHED": partial++; break;
    }
    if ((it.trackingUrl ?? "") !== "") tracked++;
  }
  if (cancelled > 0) return "CANCELLED";
  if (failed > 0) return "FAILED";
  if (initiated > 0) return "INITIATED";
  if (partial > 0) return "PARTIALLY_DISPATCHED";
  if (tracked === 0) return "PROCESSING";
  if (tracked === itemCount) return "DISPATCHED";
  return "IN_TRANSIT";
}

// Payment status = Loom's order-list COALESCE(max(paymentStatus) over PRE_ORDER
// items, max(paymentStatus) over all items). Verified 0 mismatches vs the live
// preview endpoint across all 2645 orders. Returns only canonical PaymentStatus.
function derivePaymentStatus(
  items: Array<{ paymentStatus?: string; orderType?: string }>,
): string {
  if (!items?.length) return "PENDING";
  const preOrder = items
    .filter((i) => (i.orderType ?? "").toUpperCase() === "PRE_ORDER")
    .map((i) => i.paymentStatus ?? "")
    .filter(Boolean);
  const all = items.map((i) => i.paymentStatus ?? "").filter(Boolean);
  const pool = preOrder.length ? preOrder : all;
  if (!pool.length) return "PENDING";
  return pool.reduce((a, b) => (b > a ? b : a)).toUpperCase();
}

function getProductName(item: Record<string, unknown>): { name: string; sku: string } {
  const customization = item.customization as Record<string, unknown> | undefined;
  if (customization) {
    const preview = (customization.fabricProductPreview ?? customization.finishedProductPreview) as Record<string, unknown> | undefined;
    if (preview?.product) {
      const p = preview.product as Record<string, unknown>;
      return { name: String(p.name ?? "—"), sku: String(p.sku ?? "—") };
    }
  }
  return { name: "—", sku: "—" };
}

// Row-level badge + fulfilment-progress fields, derived ONLY from the order's
// item rows already present in the data dump (no extra fetch). Replicates what
// live's preview endpoint computes server-side (OrderPreviewItem):
//   - badges:   swatch / wholesale(loyalty) / made-to-order / pre-order + type
//   - progress: shipped / in-production / ready / cancelled item buckets
//   - overdue:  live uses a workflow-subprocess signal the dump does NOT carry;
//               the dump-derivable proxy is "in-flight AND the latest
//               estimatedDeliveryTo has already passed".
function deriveOrderRowExtras(
  items: Array<Record<string, unknown>>,
  overallStatus: string,
) {
  let processing = 0, ready = 0, dispatched = 0, cancelled = 0;
  let hasSwatch = false, hasMTO = false, hasPre = false, hasFinished = false, hasFabric = false;
  let estFrom = 0, estTo = 0;
  for (const it of items) {
    const st = String(it.orderStatus ?? "").toUpperCase();
    const group = String(it.productGroup ?? "").toLowerCase();
    const type = String(it.orderType ?? "").toUpperCase();
    const tracked = String(it.trackingUrl ?? "") !== "";
    // Mutually-exclusive fulfilment buckets (sum === itemCount) so progress-bar
    // segments never exceed 100%.
    if (tracked) dispatched++;
    else if (st === "CANCELLED") cancelled++;
    else if (st === "PROCESSING" || st === "INITIATED") processing++;
    else ready++;
    if (group === "swatch") hasSwatch = true;
    else if (group === "fabric") hasFabric = true;
    else if (group === "finished") hasFinished = true;
    if (type === "MADE_TO_ORDER") hasMTO = true;
    if (type === "PRE_ORDER") hasPre = true;
    const f = Number(it.estimatedDeliveryFrom ?? 0);
    const t = Number(it.estimatedDeliveryTo ?? 0);
    if (f > 0 && (estFrom === 0 || f < estFrom)) estFrom = f;
    if (t > estTo) estTo = t;
  }
  const productType = hasFinished && hasFabric ? "MIXED" : hasFinished ? "FINISHED" : hasFabric ? "FABRIC" : "";
  const terminal = overallStatus === "DISPATCHED" || overallStatus === "DELIVERED"
    || overallStatus === "CANCELLED" || overallStatus === "FAILED" || overallStatus === "INITIATED";
  const isOverdue = !terminal && estTo > 0 && estTo < Date.now();
  return {
    hasSwatchItems: hasSwatch,
    hasMadeToOrderItems: hasMTO,
    hasPreOrderItems: hasPre,
    productType,
    isOverdue,
    processingItemCount: processing,
    readyItemCount: ready,
    dispatchedItemCount: dispatched,
    cancelledItemCount: cancelled,
    estimatedDeliveryFrom: estFrom,
    estimatedDeliveryTo: estTo,
  };
}

function normalizeOrderRow(raw: Record<string, unknown>): OrderRow {
  const tenant = (raw.tenant ?? {}) as Record<string, unknown>;
  const items = (raw.orderItems ?? []) as Array<Record<string, unknown>>;
  const overallStatus = deriveOrderStatus(items as Array<{ orderStatus: string }>);
  return {
    id: Number(raw.id ?? 0),
    customerName: String(tenant.name ?? "—"),
    total: Number(raw.total ?? 0),
    currency: String(raw.currency ?? ""),
    itemCount: items.length,
    createdAt: Number(raw.createdAt ?? 0),
    overallStatus,
    paymentStatus: derivePaymentStatus(items as Array<{ paymentStatus: string }>),
    paymentMode: String(raw.paymentMode ?? ""),
    zohoOrderId: String(raw.zohoOrderId ?? ""),
    loyaltyOrder: Boolean(raw.loyaltyOrder),
    deleted: Boolean(raw.deleted),
    ...deriveOrderRowExtras(items, overallStatus),
  };
}

function normalizeOrderDetail(raw: Record<string, unknown>): OrderDetail {
  const tenant = (raw.tenant ?? {}) as Record<string, unknown>;
  const address = (raw.address ?? {}) as Record<string, unknown>;
  const ship = (address.shippingAddress ?? {}) as Record<string, unknown>;
  const bill = (address.billingAddress ?? {}) as Record<string, unknown>;
  const rawItems = (raw.orderItems ?? []) as Array<Record<string, unknown>>;
  const rawTxns = (raw.transactions ?? []) as Array<Record<string, unknown>>;

  const items: OrderItemRow[] = rawItems.map((item) => {
    const { name, sku } = getProductName(item);
    return {
      id: Number(item.id ?? 0),
      orderId: Number(item.orderId ?? 0),
      productName: name,
      sku,
      productGroup: String(item.productGroup ?? ""),
      orderType: String(item.orderType ?? ""),
      quantity: Number(item.quantity ?? 0),
      unit: String(item.unit ?? ""),
      price: Number(item.price ?? 0),
      currency: String(item.currency ?? ""),
      orderStatus: String(item.orderStatus ?? ""),
      paymentStatus: String(item.paymentStatus ?? ""),
      dispatchedOn: Number(item.dispatchedOn ?? 0),
      estimatedDeliveryFrom: Number(item.estimatedDeliveryFrom ?? 0),
      estimatedDeliveryTo: Number(item.estimatedDeliveryTo ?? 0),
      trackingUrl: String(item.trackingUrl ?? ""),
      shippingCode: String(item.shippingCode ?? ""),
      zohoPackageId: String(item.zohoPackageId ?? ""),
    };
  });

  return {
    id: Number(raw.id ?? 0),
    version: Number(raw.version ?? 0),
    customerName: String(tenant.name ?? "—"),
    subTotal: Number(raw.subTotal ?? 0),
    shippingCost: Number(raw.shippingCost ?? 0),
    total: Number(raw.total ?? 0),
    currency: String(raw.currency ?? ""),
    advancePay: Number(raw.advancePay ?? 0),
    remainingPay: Number(raw.remainingPay ?? 0),
    autoDiscount: Number(raw.autoDiscount ?? 0),
    couponApplied: Boolean(raw.couponApplied),
    couponCode: String(raw.couponCode ?? ""),
    couponDiscount: Number(raw.couponDiscount ?? 0),
    couponDiscountAmount: Number(raw.couponDiscountAmount ?? 0),
    loyaltyOrder: Boolean(raw.loyaltyOrder),
    loyaltyDiscount: Number(raw.loyaltyDiscount ?? 0),
    loyaltyDiscountAmount: Number(raw.loyaltyDiscountAmount ?? 0),
    note: String(raw.note ?? ""),
    globalNote: String(raw.globalNote ?? ""),
    zohoOrderId: String(raw.zohoOrderId ?? ""),
    paymentMode: String(raw.paymentMode ?? ""),
    exchangeRate: Number(raw.exchangeRate ?? 0),
    createdAt: Number(raw.createdAt ?? 0),
    deleted: Boolean(raw.deleted),
    cancellationReason: String(raw.cancellationReason ?? ""),
    shippingAddress: ship.id ? {
      name: String(ship.name ?? ""),
      city: String(ship.city ?? ""),
      state: String(ship.state ?? ""),
      country: String(ship.country ?? ""),
      postalCode: String(ship.postalCode ?? ""),
      addressLineOne: String(ship.addressLineOne ?? ""),
      contactEmail: String(ship.contactEmail ?? ""),
      primaryPhone: String(ship.primaryPhone ?? ""),
    } : undefined,
    billingAddress: bill.id ? {
      name: String(bill.name ?? ""),
      city: String(bill.city ?? ""),
      state: String(bill.state ?? ""),
      country: String(bill.country ?? ""),
      postalCode: String(bill.postalCode ?? ""),
      addressLineOne: String(bill.addressLineOne ?? ""),
      contactEmail: String(bill.contactEmail ?? ""),
      primaryPhone: String(bill.primaryPhone ?? ""),
    } : undefined,
    items,
    transactions: rawTxns.map((t) => ({
      id: Number(t.id ?? 0),
      amount: Number(t.amount ?? 0),
      currency: String(t.currency ?? ""),
      status: String(t.status ?? ""),
      transactionId: String(t.transactionId ?? ""),
      createdAt: String(t.createdAt ?? ""),
    })),
  };
}

/**
 * Fetch the full order dump and normalize to lean OrderRow list.
 * Merges newly placed database orders at the top so new storefront orders appear instantly.
 */
export async function getOrderList(token?: string): Promise<OrderRow[]> {
  const recentPromise = getRecentDbOrders().catch(() => [] as OrderRow[]);
  let dumpRows: OrderRow[] = [];

  try {
    const raw = await request<{
      success: boolean;
      orderList?: Record<string, unknown>[];
      data?: Record<string, unknown>[];
    }>("/get/data-dump/order", {}, token);

    const rows = raw.orderList ?? raw.data;
    if (Array.isArray(rows)) {
      const needsJoin = rows.length > 0 && rows.every((r) => r.orderItems === undefined);
      if (!needsJoin) {
        dumpRows = rows.map(normalizeOrderRow);
      } else {
        const [itemsByOrder, tenantsById] = await Promise.all([
          fetchOrderItemsByOrderId(token),
          fetchTenantsById(token),
        ]);
        dumpRows = rows.map((r) =>
          normalizeOrderRow({
            ...r,
            orderItems: itemsByOrder.get(String(r.id)) ?? [],
            tenant: tenantsById.get(String(r.tenantId)) ?? r.tenant,
          }),
        );
      }
    }
  } catch (dumpErr) {
    console.warn("[cms/api] Order dump fetch warning:", dumpErr);
  }

  const recent = await recentPromise;
  if (recent.length === 0 && dumpRows.length === 0) {
    throw new Error("Could not load orders from backend or database.");
  }

  const recentIds = new Set(recent.map((r) => r.id));
  const remaining = dumpRows.filter((r) => !recentIds.has(r.id));
  return [...recent, ...remaining];
}

/**
 * In-process cache for the two join dumps.
 */
const JOIN_CACHE_TTL_MS = 5 * 60 * 1000;

const joinCache = new Map<string, { promise: Promise<unknown>; expiresAt: number }>();

function cachedJoin<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = joinCache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.promise as Promise<T>;

  const promise = load().catch((err) => {
    joinCache.delete(key);
    throw err;
  });
  joinCache.set(key, { promise, expiresAt: Date.now() + JOIN_CACHE_TTL_MS });
  return promise;
}

/** order-item dump grouped by `orderId`. Throws rather than degrading to "no items". */
function fetchOrderItemsByOrderId(
  token?: string,
): Promise<Map<string, Record<string, unknown>[]>> {
  return cachedJoin("order-item", () => loadOrderItemsByOrderId(token));
}

async function loadOrderItemsByOrderId(
  token?: string,
): Promise<Map<string, Record<string, unknown>[]>> {
  const raw = await request<{
    success: boolean;
    orderItemList?: Record<string, unknown>[];
    data?: Record<string, unknown>[];
  }>("/get/data-dump/order-item", {}, token);

  const items = raw.orderItemList ?? raw.data;
  if (!Array.isArray(items)) {
    throw new Error(
      `Order-item dump missing both 'orderItemList' and 'data' keys (got: ${Object.keys(raw).join(", ") || "no keys"})`,
    );
  }

  const byOrder = new Map<string, Record<string, unknown>[]>();
  for (const item of items) {
    const key = String(item.orderId ?? "");
    if (!key) continue;
    const bucket = byOrder.get(key);
    if (bucket) bucket.push(item);
    else byOrder.set(key, [item]);
  }
  return byOrder;
}

/**
 * tenant dump keyed by id, for the customer name column.
 */
function fetchTenantsById(
  token?: string,
): Promise<Map<string, Record<string, unknown>>> {
  return cachedJoin("tenant", () => loadTenantsById(token));
}

async function loadTenantsById(
  token?: string,
): Promise<Map<string, Record<string, unknown>>> {
  try {
    const raw = await request<{
      success: boolean;
      tenantList?: Record<string, unknown>[];
      data?: Record<string, unknown>[];
    }>("/get/data-dump/tenant", {}, token);

    const tenants = raw.tenantList ?? raw.data;
    if (!Array.isArray(tenants)) return new Map();

    return new Map(
      tenants.map((t) => [
        String(t.id ?? ""),
        { ...t, name: t.name ?? t.userName ?? (String(t.email ?? "").split("@")[0] || undefined) },
      ]),
    );
  } catch {
    return new Map();
  }
}

/**
 * Fetch a single order by id. Returns null only when the backend genuinely has
 * no such order — a transport/auth failure THROWS.
 *
 * This used to `catch { return null }`, which reported every failure as "no
 * order matched this id". A 401 from the credential mix-up therefore rendered
 * "Order not found" on an order that existed and was fully paid — the caller
 * cannot tell "absent" from "broken", so the page shows a confident wrong
 * answer. Callers already handle a thrown error (the detail page renders
 * LoadError, the route handler returns 500).
 */
export async function getOrderById(id: number, token?: string): Promise<OrderDetail | null> {
  try {
    const dbDetail = await getDbOrderDetail(id);
    if (dbDetail) return dbDetail;
  } catch {
    // continue
  }

  const raw = await request<{ success: boolean; order: Record<string, unknown> }>(
    "/get/super-user/order/" + id,
    {},
    token,
  );
  if (!raw.success || !raw.order) return null;

  const order = raw.order;

  // Same flat-row shape as the list dump: the v2 API's single-order response
  // carries no nested `orderItems`/`tenant`, and item-level status lives only
  // on the item rows. Without this the detail page and the inline "what's
  // happening" panel both render "0 items" for an order that has them.
  if (order.orderItems === undefined) {
    const [itemsByOrder, tenantsById] = await Promise.all([
      fetchOrderItemsByOrderId(token),
      fetchTenantsById(token),
    ]);
    return normalizeOrderDetail({
      ...order,
      orderItems: itemsByOrder.get(String(order.id)) ?? [],
      tenant: tenantsById.get(String(order.tenantId)) ?? order.tenant,
    });
  }

  return normalizeOrderDetail(order);
}

// ════════════════════════════════════════════════════════════════════════
// Commerce — Inventory
// ════════════════════════════════════════════════════════════════════════

export interface WarehouseItem {
  id: number;
  name: string;
  description: string;
  createdAt: number;
}

export interface InventoryAdjustmentLite {
  id: number;
  createdAt: number;
  adjustmentDate: number;
  warehouse: string;
  referenceNo: string;
  reason: string;
}

export interface InventoryAdjustmentItem {
  productId: number;
  productName: string;
  productImage: string;
  quantityAvailable: number;
  quantityAdjusted: number;
  quantityAtHand: number;
}

export interface InventoryAdjustmentDetail {
  id: number;
  createdAt: number;
  adjustmentDate: number;
  warehouse: string;
  referenceNo: string;
  reason: string;
  description: string;
  items: InventoryAdjustmentItem[];
}


export interface InventoryAdjustmentReason {
  id: number;
  reason: string;
  description: string;
  version: number;
  createdAt: number;
}

export interface OOSRequest {
  id: number;
  version: number;
  createdAt: number;
  productName: string;
  productSku: string;
  productGroup: string;
  requestedQuantity: number;
  status: string;
  notifiedAt: number;
  customerName: string;
}

export async function getWarehouses(token?: string): Promise<WarehouseItem[]> {
  try {
    const raw = await request<Record<string, unknown>>("/get/warehouse", {}, token);
    const list = Object.values(raw).find((v) => Array.isArray(v)) as Array<Record<string, unknown>> | undefined;
    return (list ?? []).map((w) => ({
      id: Number(w.id ?? 0),
      name: String(w.name ?? ""),
      description: String(w.description ?? ""),
      createdAt: Number(w.createdAt ?? 0),
    }));
  } catch { return []; }
}

export async function getInventoryAdjustments(token?: string): Promise<InventoryAdjustmentLite[]> {
  try {
    const raw = await request<Record<string, unknown>>("/get/inventory-adjustment", {}, token);
    const list = Object.values(raw).find((v) => Array.isArray(v)) as Array<Record<string, unknown>> | undefined;
    return (list ?? []).map((a) => ({
      id: Number(a.id ?? 0),
      createdAt: Number(a.createdAt ?? 0),
      adjustmentDate: Number(a.adjustmentDate ?? 0),
      warehouse: String(a.warehouse ?? ""),
      referenceNo: String(a.referenceNo ?? ""),
      reason: String(a.reason ?? ""),
    }));
  } catch { return []; }
}

export async function getInventoryAdjustmentById(id: number, token?: string): Promise<InventoryAdjustmentDetail | null> {
  try {
    const raw = await request<{ success: boolean; inventoryAdjustment: Record<string, unknown> }>(
      "/get/inventory-adjustment/" + id,
      {},
      token,
    );
    const adj = raw.inventoryAdjustment;
    if (!adj) return null;
    const items = (adj.adjustmentItemList ?? []) as Array<Record<string, unknown>>;
    return {
      id: Number(adj.id ?? 0),
      createdAt: Number(adj.createdAt ?? 0),
      adjustmentDate: Number(adj.adjustmentDate ?? 0),
      warehouse: String((adj.warehouse as Record<string, unknown>)?.name ?? adj.warehouse ?? ""),
      referenceNo: String(adj.referenceNo ?? ""),
      reason: String((adj.reason as Record<string, unknown>)?.name ?? adj.reason ?? ""),
      description: String(adj.description ?? ""),
      items: items.map((i) => ({
        productId: Number(i.productId ?? 0),
        productName: String((i.product as Record<string, unknown>)?.name ?? i.productName ?? ""),
        productImage: String((i.product as Record<string, unknown>)?.heroImage ?? i.productImage ?? ""),
        quantityAvailable: Number(i.quantityAvailable ?? 0),
        quantityAdjusted: Number(i.quantityAdjusted ?? 0),
        quantityAtHand: Number(i.quantityAtHand ?? 0),
      })),
    };
  } catch { return null; }
}

export async function getOOSRequests(token?: string): Promise<OOSRequest[]> {
  try {
    const raw = await request<{ inventoryReStockRequestList: Array<Record<string, unknown>> }>(
      "/get/inventory-restock-request",
      {},
      token,
    );
    return (raw.inventoryReStockRequestList ?? []).map((r) => {
      const product = (r.product ?? {}) as Record<string, unknown>;
      const tenant = (r.tenant ?? {}) as Record<string, unknown>;
      return {
        id: Number(r.id ?? 0),
        version: Number(r.version ?? 0),
        createdAt: Number(r.createdAt ?? 0),
        productName: String(product.name ?? "—"),
        productSku: String(product.sku ?? "—"),
        productGroup: String(r.productGroup ?? ""),
        requestedQuantity: Number(r.requestedQuantity ?? 0),
        status: String(r.status ?? ""),
        notifiedAt: Number(r.notifiedAt ?? 0),
        customerName: String(tenant.name ?? "—"),
      };
    });
  } catch { return []; }
}


// ════════════════════════════════════════════════════════════════════════
// Inventory adjustment reasons
// ════════════════════════════════════════════════════════════════════════

export async function getInventoryAdjustmentReasons(token?: string): Promise<InventoryAdjustmentReason[]> {
  try {
    const raw = await request<{ inventoryAdjustmentReasonList: Array<Record<string, unknown>> }>(
      '/get/inventory-adjustment-reason',
      {},
      token,
    );
    return (raw.inventoryAdjustmentReasonList ?? []).map((r) => ({
      id: Number(r.id ?? 0),
      reason: String(r.reason ?? ''),
      description: String(r.description ?? ''),
      version: Number(r.version ?? 0),
      createdAt: Number(r.createdAt ?? 0),
    }));
  } catch { return []; }
}

// ════════════════════════════════════════════════════════════════════════
// Dashboard — Real aggregates
// ════════════════════════════════════════════════════════════════════════

export interface DashboardCounts {
  totalListings: number;
  activeListings: number;
  openOrders: number;
  oosRequests: number;
}

// ── In-process TTL cache (stale-while-revalidate) ────────────────────────────
// Fetching fabric + finished preview lists costs ~16.5 MB and 6–15 s on every
// request. We cache the three computed counts for 10 min; on expiry we return
// the stale value instantly and refresh in the background so the next hit is
// already warm. Only the very first cold-start blocks on the upstream fetch.
const DASHBOARD_COUNTS_TTL_MS = 10 * 60 * 1000; // 10 minutes

let _dashboardCache: { data: DashboardCounts; expiresAt: number } | null = null;
let _dashboardRefreshing = false;

async function _fetchDashboardCountsLive(token?: string): Promise<DashboardCounts> {
  const [fabricRes, finishedRes, allRes, oosRes] = await Promise.all([
    request<{ success: boolean; productPreviewList: Array<Record<string, unknown>> }>(
      "/get/fabric-preview-list", {}, token,
    ).catch(() => ({ success: false, productPreviewList: [] })),
    request<{ success: boolean; productPreviewList: Array<Record<string, unknown>> }>(
      "/get/finished-preview-list", {}, token,
    ).catch(() => ({ success: false, productPreviewList: [] })),
    // Was a bare fetch straight at loom-v2, unauthenticated and outside the
    // configured backend. Same route, same helper as its three siblings.
    request<{ productPreviewList: Array<Record<string, unknown>> }>(
      "/get/product-preview-list/all", {}, token,
    ).catch(() => ({ productPreviewList: [] })),
    request<{ inventoryReStockRequestList: unknown[] }>(
      "/get/inventory-restock-request", {}, token,
    ).catch(() => ({ inventoryReStockRequestList: [] })),
  ]);

  let allListings = [
    ...(fabricRes.productPreviewList ?? []),
    ...(finishedRes.productPreviewList ?? []),
  ];
  if (
    allListings.length === 0 &&
    Array.isArray(allRes.productPreviewList) &&
    allRes.productPreviewList.length > 0
  ) {
    allListings = allRes.productPreviewList;
  }

  const activeListings = allListings.filter((r) => {
    const p = (r.product ?? r) as Record<string, unknown>;
    return p.mainProductCheck === true && !p.disabled;
  });

  const outOfStockListings = allListings.filter((r) => {
    const p = (r.product ?? r) as Record<string, unknown>;
    const qty = Number(p.quantity ?? p.totalQuantity ?? 0);
    return qty <= 0;
  });

  const oosCount =
    (oosRes.inventoryReStockRequestList ?? []).length || outOfStockListings.length;

  return {
    totalListings: allListings.length,
    activeListings: activeListings.length,
    openOrders: 0,
    oosRequests: oosCount,
  };
}

/**
 * Return dashboard KPI counts (totalListings, activeListings, oosRequests).
 *
 * Cache strategy — in-process TTL with stale-while-revalidate:
 *   - Cache hit  → return instantly (no upstream call).
 *   - Stale hit  → return old data instantly + kick off background refresh.
 *   - Cold start → block on upstream (first-ever load only).
 *
 * Numbers are IDENTICAL to the uncached path — this is a caching layer only,
 * the count logic inside _fetchDashboardCountsLive is unchanged.
 */
export async function getDashboardCounts(token?: string): Promise<DashboardCounts> {
  // Fast path: fresh cache
  if (_dashboardCache && Date.now() < _dashboardCache.expiresAt) {
    return _dashboardCache.data;
  }

  // Stale-while-revalidate: return old data now, refresh behind the scenes
  if (_dashboardCache && !_dashboardRefreshing) {
    _dashboardRefreshing = true;
    const stale = _dashboardCache.data;
    _fetchDashboardCountsLive(token)
      .then((counts) => {
        _dashboardCache = { data: counts, expiresAt: Date.now() + DASHBOARD_COUNTS_TTL_MS };
      })
      .catch(() => { /* keep stale on refresh failure */ })
      .finally(() => { _dashboardRefreshing = false; });
    return stale;
  }

  // Cold start (empty cache): block on the upstream fetch once
  try {
    const counts = await _fetchDashboardCountsLive(token);
    _dashboardCache = { data: counts, expiresAt: Date.now() + DASHBOARD_COUNTS_TTL_MS };
    return counts;
  } catch {
    return { totalListings: 0, activeListings: 0, openOrders: 0, oosRequests: 0 };
  }
}


// ════════════════════════════════════════════════════════════════════════
// Cluster & Craft traceability (story-mapping)
// ════════════════════════════════════════════════════════════════════════

export interface StoryOption { id: number; title: string; type: string }
export interface CraftRef { id: number; title: string }
export interface ClusterRef { id: number; title: string; isHandloom: boolean }

export interface StoryMappingDetail {
  productId: number;
  current: { craft: CraftRef | null; clusters: ClusterRef[] };
  derived: {
    status: string;
    craftStoryId: number | null;
    clusterStoryIds: number[];
    handloomUmbrella: boolean;
  } | null;
  manualOverride: boolean;
  needsReview: boolean;
  status: "auto-derived" | "manual-override" | "needs-mapping";
}

export interface StoryReviewRow {
  id: number | string;
  product_id: number | string;
  sub_category_id: number | string | null;
  reason: string | null;
  created_at: string;
  product_name: string | null;
  sku: string | null;
  sub_category_name: string | null;
}

/** Product -> combined craft/cluster mapping detail (current tags + derivation status). */
export async function getStoryMappingDetail(id: number, token?: string): Promise<StoryMappingDetail> {
  return request<StoryMappingDetail>(`/get/story/mapping-detail/product/${id}`, {}, token);
}

/** All stories of a storyContentType, for the override dropdowns. */
export async function getStoriesByType(type: "CRAFTS" | "CLUSTERS", token?: string): Promise<StoryOption[]> {
  const r = await request<{ stories: StoryOption[] }>(`/get/story/list-by-type/${type}`, {}, token);
  return r.stories ?? [];
}

/** Needs-mapping review queue (enriched with product name / sku / subcategory). */
export async function getStoryReviewQueue(token?: string): Promise<StoryReviewRow[]> {
  const r = await request<{ reviewList: StoryReviewRow[] }>(`/get/story/review-queue`, {}, token);
  return r.reviewList ?? [];
}
