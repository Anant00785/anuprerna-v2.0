/**
 * Ports of Loom's impact read models:
 *   impact/pojo/ImpactSummary.java, ImpactItem.java, ImpactAggregationSummary.java
 *
 * Field names and zero-defaults are Loom's — the CMS reads them verbatim
 * (apps/cms/src/lib/impact-api.ts, artisanflow-api.ts getCustomOrderImpact).
 */

export interface ImpactItem {
    workflowId: number | null;
    orderItemId: number | null;
    productType: string | null;
    calculationStatus: string | null;
    pendingReason: string | null;
    fabricMeters: number | null;
    co2OffsetKg: number | null;
    waterSavedLitres: number | null;
    artisanHours: number | null;
    womenArtisanHours: number | null;
    stitchingHours: number | null;
    womenStitchingHours: number | null;
    totalWorkHours: number | null;
    assumptionVersion: number | null;
    updatedAt: number | null;
}

export interface ImpactSummary {
    orderId: number;
    configurationError: string | null;
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

export interface ImpactAggregation {
    totalOrders: number;
    totalItems: number;
    completeItems: number;
    partialItems: number;
    fabricItems: number;
    apparelItems: number;
    fabricMeters: number;
    co2OffsetKg: number;
    waterSavedLitres: number;
    artisanHours: number;
    womenArtisanHours: number;
    stitchingHours: number;
    womenStitchingHours: number;
    totalWorkHours: number;
}

/** The metric fields ImpactSummary sums across its items. */
const METRICS = [
    "fabricMeters",
    "co2OffsetKg",
    "waterSavedLitres",
    "artisanHours",
    "womenArtisanHours",
    "stitchingHours",
    "womenStitchingHours",
    "totalWorkHours",
] as const;

/** Loom's `safe(Double)`: null aggregates as zero. Numerics arrive as strings. */
function safe(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function nullableNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

/** Loom: ImpactSummary.emptyOrder(orderId). */
export function emptyImpactSummary(orderId: number): ImpactSummary {
    return {
        orderId,
        configurationError: null,
        completeItems: 0,
        partialItems: 0,
        fabricMeters: 0,
        co2OffsetKg: 0,
        waterSavedLitres: 0,
        artisanHours: 0,
        womenArtisanHours: 0,
        stitchingHours: 0,
        womenStitchingHours: 0,
        totalWorkHours: 0,
        items: [],
    };
}

/** Loom: CustomImpactFactorDAOController.buildImpactItem. */
function toImpactItem(raw: Record<string, unknown>): ImpactItem {
    return {
        workflowId: nullableNumber(raw.workflowId),
        orderItemId: nullableNumber(raw.customOrderItemId),
        productType: (raw.productType as string) ?? null,
        calculationStatus: (raw.calculationStatus as string) ?? null,
        pendingReason: (raw.pendingReason as string) ?? null,
        fabricMeters: nullableNumber(raw.fabricMeters),
        co2OffsetKg: nullableNumber(raw.co2OffsetKg),
        waterSavedLitres: nullableNumber(raw.waterSavedLitres),
        artisanHours: nullableNumber(raw.artisanHours),
        womenArtisanHours: nullableNumber(raw.womenArtisanHours),
        stitchingHours: nullableNumber(raw.stitchingHours),
        womenStitchingHours: nullableNumber(raw.womenStitchingHours),
        totalWorkHours: nullableNumber(raw.totalWorkHours),
        assumptionVersion: nullableNumber(raw.assumptionVersion),
        updatedAt: nullableNumber(raw.updatedAt),
    };
}

/**
 * Loom: CustomImpactFactorDAOController.buildOrderSummary — sums every metric
 * across the rows and counts COMPLETE vs everything-else (Loom's else branch
 * puts any non-COMPLETE status in partialItems, PENDING included).
 */
export function buildCustomOrderImpactSummary(orderId: number, rows: unknown[]): ImpactSummary {
    const items = (Array.isArray(rows) ? rows : []).map((r) => toImpactItem(r as Record<string, unknown>));
    const summary = emptyImpactSummary(orderId);
    summary.items = items;

    for (const item of items) {
        for (const metric of METRICS) {
            summary[metric] += safe(item[metric]);
        }
        if (item.calculationStatus === "COMPLETE") summary.completeItems += 1;
        else summary.partialItems += 1;
    }
    return summary;
}

/**
 * Loom: ImpactAggregationSummary.firstOrEmpty — a missing row is all-zeroes.
 * The SQL returns snake_case; pg gives bigint counts back as strings.
 */
export function toImpactAggregation(row: unknown): ImpactAggregation {
    const r = (row ?? {}) as Record<string, unknown>;
    return {
        totalOrders: safe(r.total_orders),
        totalItems: safe(r.total_items),
        completeItems: safe(r.complete_items),
        partialItems: safe(r.partial_items),
        fabricItems: safe(r.fabric_items),
        apparelItems: safe(r.apparel_items),
        fabricMeters: safe(r.fabric_meters),
        co2OffsetKg: safe(r.co2_offset_kg),
        waterSavedLitres: safe(r.water_saved_litres),
        artisanHours: safe(r.artisan_hours),
        womenArtisanHours: safe(r.women_artisan_hours),
        stitchingHours: safe(r.stitching_hours),
        womenStitchingHours: safe(r.women_stitching_hours),
        totalWorkHours: safe(r.total_work_hours),
    };
}
