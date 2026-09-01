/**
 * wholesale-api.ts
 *
 * Typed client-side fetch helpers for Wholesale / Loyalty Program data.
 *
 * READS (2026-07-06): switched from the GET-only Loom proxy (/api/loom/...) to
 * dedicated native server routes (/api/wholesale/metrics|eligible), matching
 * the /api/orders pattern — a direct service-token fetch to the sandbox
 * backend, no proxy hop. Payload-shape normalization lives here in one typed
 * mapper per data type. Each fetcher returns a discriminated Result so an
 * outage renders an error banner, never a silent "no customers found".
 *
 * WRITES: thin wrapper around POST /api/crud (POST /enable/loyalty-program —
 * sandbox Postgres only, never live Loom/Zoho).
 */

import type { Result } from './result';

// -- Types ---------------------------------------------------------------------

export interface WholesaleMetricsRow {
  customerId: number;
  userName: string;
  email: string;
  totalOrderCount: number;
  totalOrderValue: number;
  totalLoyaltyOrderCount: number;
  totalLoyaltyDiscountValue: number;
  cycleTotalOrderCount: number;
  membershipConfig?: {
    id: number;
    tenure: number;
    discountPercentage: number;
    minimumOrderValue: number;
    minimumOrderValueINR: number;
    minimumOrderValueCurrency: string;
    exchangeRate: number;
    endDate: number;
  };
}

export interface WholesaleEligibleCustomer {
  customerId: number;
  userName: string;
  email: string;
  totalOrderCount: number;
  totalOrderValue: number;
  tenureMonths: number;
  eligible: boolean;
}

export interface EligibleFilter {
  email?: string;
  tenureMonths?: number;
  minimumTotalAmount?: number;
}

// -- Fetch + shape helpers -------------------------------------------------------

async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error('Request failed (' + res.status + ')');
  return res.json();
}

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

// -- Normalizers ---------------------------------------------------------------

function mapMetrics(data: unknown): WholesaleMetricsRow[] {
  return asRows(data, 'customerList', 'customers', 'list').map((r) => {
    const mc = r.membershipConfig as Record<string, unknown> | undefined;
    return {
      customerId: Number(r.customerId ?? 0),
      userName: String(r.userName ?? ''),
      email: String(r.email ?? ''),
      totalOrderCount: Number(r.totalOrderCount ?? 0),
      totalOrderValue: Number(r.totalOrderValue ?? 0),
      totalLoyaltyOrderCount: Number(r.totalLoyaltyOrderCount ?? 0),
      totalLoyaltyDiscountValue: Number(r.totalLoyaltyDiscountValue ?? 0),
      cycleTotalOrderCount: Number(r.cycleTotalOrderCount ?? 0),
      membershipConfig: mc
        ? {
            id: Number(mc.id ?? 0),
            tenure: Number(mc.tenure ?? 0),
            discountPercentage: Number(mc.discountPercentage ?? 0),
            minimumOrderValue: Number(mc.minimumOrderValue ?? 0),
            minimumOrderValueINR: Number(mc.minimumOrderValueINR ?? 0),
            minimumOrderValueCurrency: String(mc.minimumOrderValueCurrency ?? ''),
            exchangeRate: Number(mc.exchangeRate ?? 0),
            endDate: Number(mc.endDate ?? 0),
          }
        : undefined,
    };
  });
}

function mapEligible(data: unknown): WholesaleEligibleCustomer[] {
  return asRows(data, 'customerList', 'customers', 'eligibleCustomers', 'list').map((r) => ({
    customerId: Number(r.customerId ?? 0),
    userName: String(r.userName ?? ''),
    email: String(r.email ?? ''),
    totalOrderCount: Number(r.orderCount ?? r.totalOrderCount ?? 0),
    totalOrderValue: Number(r.totalOrderValueRs ?? r.totalOrderValue ?? 0),
    tenureMonths: Number(r.tenureMonths ?? 0),
    eligible: r.membershipStatus != null ? String(r.membershipStatus) === 'ACTIVE' : Boolean(r.eligible),
  }));
}

// -- Fetchers (reads) -----------------------------------------------------------

export async function fetchWholesaleMetrics(
  active: boolean,
): Promise<Result<WholesaleMetricsRow[]>> {
  try {
    const data = await apiGet('/api/wholesale/metrics?active=' + active);
    return { ok: true, data: mapMetrics(data) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function fetchEligibleCustomers(
  filter: EligibleFilter,
): Promise<Result<WholesaleEligibleCustomer[]>> {
  try {
    const params = new URLSearchParams();
    if (filter.email) {
      params.set('email', filter.email);
    } else {
      if (filter.tenureMonths != null) params.set('tenure', String(filter.tenureMonths));
      if (filter.minimumTotalAmount != null)
        params.set('minimumTotalAmount', String(filter.minimumTotalAmount));
    }
    const data = await apiGet('/api/wholesale/eligible?' + params.toString());
    return { ok: true, data: mapEligible(data) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// -- Writes (POST /api/crud -> sandbox Postgres only) ---------------------------

export interface EnrollLoyaltyInput {
  id?: number; // present = renew existing config; absent = new enrollment
  customerId: number;
  tenure: number;
  discountPercentage: number;
  minimumOrderValue: number;
  minimumOrderValueINR?: number;
  minimumOrderValueCurrency?: string;
  exchangeRate?: number;
  type: 'ONBOARDING' | 'RENEWAL_MANUAL';
}

export async function enableLoyaltyProgram(body: EnrollLoyaltyInput): Promise<{ success: boolean; message?: string }> {
  const res = await fetch('/api/crud', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: 'enable/loyalty-program', method: 'POST', body }),
  });
  const j = await res.json().catch(() => ({}));
  const ok = res.ok && j?.success !== false;
  if (!ok) throw new Error(j?.message || 'Enrollment failed (' + res.status + ')');
  return j;
}
