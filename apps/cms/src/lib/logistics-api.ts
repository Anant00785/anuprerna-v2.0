/**
 * logistics-api.ts
 *
 * Typed client-side fetch helpers for Logistics data (Shipping, Discount, Forex).
 *
 * READS (2026-07-06): switched from the old GET-only Loom proxy (/api/loom/...)
 * to dedicated native server routes (/api/logistics/shipments|discounts|forex),
 * matching the pattern already used by /api/orders — a direct service-token
 * fetch to the sandbox backend, no proxy hop. Payload-shape normalization (the
 * old `data.shipmentList ?? data.list ?? []` guessing) stays here in one typed
 * mapper per data type. Each fetcher returns a discriminated Result so a
 * backend outage surfaces as an error banner, never a silent empty list.
 *
 * WRITES: thin wrappers around POST /api/crud (the single authenticated write
 * forwarder — sandbox Postgres only, never live Loom/Zoho).
 */

import type { Result } from './result';

// -- Types ---------------------------------------------------------------------

export interface ShippingItem {
  id: number;
  name: string;
  locationType: string;
  baseAmount: number;
  baseQuantity: number;
  additionalAmount: number;
  estimatedFromDay: number;
  estimatedToDay: number;
}

export interface DiscountItem {
  id: number;
  code: string;
  discountValue: number;
  discountType: string;
  discountMethod: string;
  minimumOrderValue: number;
  location: string;
  maxUsage: number;
  currentUsage: number;
  active: boolean;
  expiryDate?: number;
  startDate?: number;
}

export interface ForexItem {
  id: number;
  country: string;
  currency: string;
  rate: number;
}

export interface WriteResult {
  success: boolean;
  message?: string;
}

// -- Fetch + shape helpers -------------------------------------------------------

async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error('Request failed (' + res.status + ')');
  return res.json();
}

async function crudWrite(path: string, method: string, body?: unknown): Promise<WriteResult> {
  const res = await fetch('/api/crud', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: path.replace(/^\/+/, ''), method, body }),
  });
  const j = await res.json().catch(() => ({}));
  const ok = res.ok && j?.success !== false;
  if (!ok) throw new Error(j?.message || 'Request failed (' + res.status + ')');
  return j as WriteResult;
}

/** Pull the list out of a response that may be an array or a wrapper object. */
function asRows(data: unknown, ...keys: string[]): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === 'object') {
    for (const k of keys) {
      const v = (data as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v as Record<string, unknown>[];
    }
  }
  return [];
}

// -- Normalizers (typed lean rows) ---------------------------------------------

function mapShipping(data: unknown): ShippingItem[] {
  return asRows(data, 'shipmentList', 'shippingList', 'list').map((r) => ({
    id: Number(r.id ?? 0),
    name: String(r.name ?? ''),
    locationType: String(r.locationType ?? ''),
    baseAmount: Number(r.baseAmount ?? 0),
    baseQuantity: Number(r.baseQuantity ?? 0),
    additionalAmount: Number(r.additionalAmount ?? 0),
    estimatedFromDay: Number(r.estimatedFromDay ?? 0),
    estimatedToDay: Number(r.estimatedToDay ?? 0),
  }));
}

function mapDiscount(data: unknown): DiscountItem[] {
  return asRows(data, 'discountList', 'list').map((r) => ({
    id: Number(r.id ?? 0),
    code: String(r.couponCode ?? r.code ?? ''),
    discountValue: Number(r.discountPercentage ?? r.discountValue ?? 0),
    discountType: String(r.discountType ?? ''),
    discountMethod: String(r.discountMethod ?? ''),
    minimumOrderValue: Number(r.minimumOrderValue ?? 0),
    location: String(r.location ?? ''),
    maxUsage: Number(r.maxUsage ?? 0),
    currentUsage: Number(r.currentUsage ?? 0),
    active: Boolean(r.active),
    expiryDate: r.endDate != null ? Number(r.endDate) : r.expiryDate != null ? Number(r.expiryDate) : undefined,
    startDate: r.startDate != null ? Number(r.startDate) : undefined,
  }));
}

function mapForex(data: unknown): ForexItem[] {
  return asRows(data, 'forexList', 'list').map((r) => ({
    id: Number(r.id ?? 0),
    country: String(r.country ?? ''),
    currency: String(r.currency ?? ''),
    rate: Number(r.rate ?? 0),
  }));
}

// -- Fetchers (reads) -----------------------------------------------------------

export async function fetchShippingList(): Promise<Result<ShippingItem[]>> {
  try {
    return { ok: true, data: mapShipping(await apiGet('/api/logistics/shipments')) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function fetchDiscountList(): Promise<Result<DiscountItem[]>> {
  try {
    return { ok: true, data: mapDiscount(await apiGet('/api/logistics/discounts')) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function fetchForexList(): Promise<Result<ForexItem[]>> {
  try {
    return { ok: true, data: mapForex(await apiGet('/api/logistics/forex')) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// -- Writes (POST /api/crud -> sandbox Postgres only) ---------------------------

export interface ShipmentInput {
  id?: number;
  name: string;
  locationType: string;
  baseAmount: number;
  baseQuantity: number;
  additionalAmount: number;
  estimatedFromDay: number;
  estimatedToDay: number;
}
export const createShipment = (b: ShipmentInput) => crudWrite('add/shipment', 'POST', b);
export const updateShipment = (b: ShipmentInput) => crudWrite('update/shipment', 'PATCH', b);
export const deleteShipment = (id: number) => crudWrite(`delete/shipment/${id}`, 'DELETE');

export interface DiscountInput {
  id?: number;
  couponCode: string;
  discountType: string; // FREE_SHIPPING | PERCENTAGE_OFF
  discountMethod: string; // AUTOMATIC | MANUAL
  discountPercentage?: number;
  minimumOrderValue?: number;
  location?: string; // DOMESTIC | INTERNATIONAL
  usageType?: string; // SINGLE | MULTIPLE
  startDate?: number;
  endDate?: number;
  active: boolean;
}
export const createDiscount = (b: DiscountInput) => crudWrite('add/discount', 'POST', b);
export const updateDiscount = (b: DiscountInput) => crudWrite('update/discount', 'PATCH', b);
export const deleteDiscount = (id: number) => crudWrite(`delete/discount/${id}`, 'DELETE');

export interface ForexInput {
  id?: number;
  country: string;
  currency: string;
  rate: number;
}
export const createForex = (b: ForexInput) => crudWrite('add/forex', 'POST', b);
export const updateForex = (b: ForexInput) => crudWrite('update/forex', 'PATCH', b);
export const deleteForex = (id: number) => crudWrite(`delete/forex/${id}`, 'DELETE');
