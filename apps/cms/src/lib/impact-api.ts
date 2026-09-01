/**
 * impact-api.ts — client-side helpers for the Impact Factor page.
 *
 * A single call to /api/impact/batch returns the order list already joined with
 * per-order impact summaries (server-side fan-out + per-order caching). No
 * client-side N+1 fan-out.
 *
 * Read-only: ZERO POST/PUT/PATCH/DELETE calls here or in the API route.
 */

import type { Result } from './result';

// -- Types ---------------------------------------------------------------------

/** Lean order row returned by /api/impact/batch. */
export interface ImpactOrderRow {
  id: number;
  name: string;
  orderStatus: string;
  createdAt: number;
  custom: boolean;
}

/** Per-order impact summary, mirroring Loom ImpactSummary (sans items[]). */
export interface ImpactSummary {
  orderId: number;
  completeItems: number;
  partialItems: number;
  fabricMeters: number;
  co2OffsetKg: number;
  waterSavedLitres: number;
  artisanHours: number;
  womenArtisanHours: number;
  stitchingHours: number;
  womenStitchingHours: number;
  totalWorkHours: number;
}

/** Order row with its impact summary joined (summary null when not computed). */
export interface ImpactOrderWithSummary extends ImpactOrderRow {
  summary: ImpactSummary | null;
}

/** Client-side roll-up of ImpactSummary across a page of orders. */
export interface ImpactTotals {
  orderCount: number;
  completeItems: number;
  partialItems: number;
  fabricMeters: number;
  co2OffsetKg: number;
  waterSavedLitres: number;
  artisanHours: number;
  womenArtisanHours: number;
  stitchingHours: number;
  womenStitchingHours: number;
  totalWorkHours: number;
}

/**
 * One row in the per-item impact table.
 *
 * Mirrors live Angular ImpactItem interface at:
 * live-weave-ref/src/app/manage-logistic/manage-order/order-detail/interface/impact-item.ts
 *
 * Canonical enum values (cite interface file, line 3-4):
 *   productType:       'FABRIC' | 'APPAREL' | string
 *   calculationStatus: 'PARTIAL' | 'COMPLETE' | string
 */
export interface ImpactItem {
  workflowId: number | null;
  orderItemId: number;
  productType: 'FABRIC' | 'APPAREL' | string;
  calculationStatus: 'PARTIAL' | 'COMPLETE' | string;
  pendingReason: string | null;
  fabricMeters: number | null;
  co2OffsetKg: number | null;
  waterSavedLitres: number | null;
  artisanHours: number | null;
  womenArtisanHours: number | null;
  stitchingHours: number | null;
  womenStitchingHours: number | null;
  totalWorkHours: number | null;
  assumptionVersion: number;
  updatedAt: number;
}

/**
 * Full impact detail for a single order: order-level summary + per-item rows.
 *
 * Returned by /get/impact/order/{id} and /get/impact/custom-order/{id}.
 * Mirrors live Angular ImpactSummary + items[] at:
 * live-weave-ref/src/app/manage-logistic/manage-order/order-detail/interface/impact-summary.ts
 */
export interface ImpactDetail {
  orderId: number;
  completeItems: number;
  partialItems: number;
  fabricMeters: number;
  co2OffsetKg: number;
  waterSavedLitres: number;
  artisanHours: number;
  womenArtisanHours: number;
  stitchingHours: number;
  womenStitchingHours: number;
  totalWorkHours: number;
  items: ImpactItem[];
}

// -- Fetch helpers -------------------------------------------------------------

/**
 * Fetch a page of orders (regular or custom) WITH their impact summaries in a
 * single request. Returns a discriminated Result so a Loom outage renders an
 * error banner rather than a misleading empty table.
 */
export async function fetchImpactBatch(
  type: 'regular' | 'custom',
  status = 'PROCESSING',
  size = 20,
): Promise<Result<ImpactOrderWithSummary[]>> {
  try {
    const params = new URLSearchParams({ type, status, size: String(size) });
    const res = await fetch('/api/impact/batch?' + params, { cache: 'no-store' });
    if (!res.ok) return { ok: false, error: 'Request failed (' + res.status + ')' };
    const data = (await res.json()) as { orders?: ImpactOrderWithSummary[] };
    return { ok: true, data: data.orders ?? [] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
