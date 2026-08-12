// @ts-nocheck
/**
 * apps/api/src/commerce/product/nav-product-preview/types/nav-product-preview.types.ts
 *
 * Source-verified types for the NavProductPreview module. Mirrors, field-for-field:
 *  - com.bloomscorp.loom.product.product.orm.NavProductPreview
 *
 * NavProductPreview maps onto the SAME table as Product (ProductContract.TABLE
 * = "product", see schema.ts `product`) — a navigation-optimized projection
 * for menu generation and product-group browsing (fabric/finished/custom).
 *
 * `category` and `segment` are declared @Transient in source, with their
 * @ManyToOne mappings commented out entirely (not just left unfetched) —
 * ported as always-null fields with no lookup path, matching source's
 * current (commented-out) state exactly rather than re-enabling a mapping
 * that isn't active in the Java code.
 */

export interface NavProductPreviewRow {
  id: bigint;
  version: bigint;
  subCategoryId: number;
  slug: string;
  materialId: string;
  colorId: string;
  patternId: string | null;
  heroImage: string;
  productGroup: string;
  disabled: boolean;
}

export interface NavProductPreviewView {
  id: number;
  version: number;
  subCategoryId: number;
  /** @Transient in source; @ManyToOne mapping is commented out — always null, no active lookup path. */
  category: null;
  /** @Transient in source; @ManyToOne mapping is commented out — always null, no active lookup path. */
  segment: null;
  slug: string;
  materialId: string;
  materials: unknown[];
  colorId: string;
  colors: unknown[];
  patternId: string;
  patterns: unknown[];
  heroImage: string;
  productGroup: string;
  disabled: boolean;
}

export interface MaterialLookupPort {
  retrieveByIds(ids: number[]): Promise<unknown[]>;
}

export interface ColorLookupPort {
  retrieveByIds(ids: number[]): Promise<unknown[]>;
}

export interface PatternLookupPort {
  retrieveByIds(ids: number[]): Promise<unknown[]>;
}

export const MATERIAL_LOOKUP_PORT = Symbol("MATERIAL_LOOKUP_PORT");
export const COLOR_LOOKUP_PORT = Symbol("COLOR_LOOKUP_PORT");
export const PATTERN_LOOKUP_PORT = Symbol("PATTERN_LOOKUP_PORT");

/** Helper to split the comma-separated *_id columns (source: "1,5,12" / "" => none). */
export function parseIdList(csv: string | null | undefined): number[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
}
