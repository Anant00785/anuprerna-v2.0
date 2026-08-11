/**
 * apps/api/src/commerce/product/product-preview/types/product-preview.types.ts
 *
 * Source-verified types for the ProductPreview module. Mirrors, field-for-field:
 *  - com.bloomscorp.loom.product.orm.ProductPreview
 *  - com.bloomscorp.loom.product.product.orm.UNIT_ENUM
 *  - com.bloomscorp.loom.search.pojo.ProductSearchResult (referenced by
 *    ProductPreviewJpaRepository's named native queries)
 *
 * ProductPreview maps onto the SAME table as Product (ProductContract.TABLE
 * = "product", see schema.ts `product`) — it is a read-optimized JPA
 * projection over the product table, not a distinct table. No fields have
 * been invented beyond what's in source; where a Java field has no
 * corresponding column in the introspected `product` pgTable (i.e. it was
 * added to the entity ahead of a pending DB migration), it is called out
 * explicitly below rather than silently included or dropped.
 *
 * `@anuprerna/types` is currently an empty workspace stub and the project
 * has no zod dependency installed, so these are plain TS types, consistent
 * with the Cart module's approach.
 */

/** com.bloomscorp.loom.product.product.orm.UNIT_ENUM — mirrors unitEnum in schema.ts exactly. */
export const UNITS = ["METER", "UNIT"] as const;
export type Unit = (typeof UNITS)[number];

/**
 * Flat DB-row shape for `product`, restricted to the fields ProductPreview
 * actually projects (source-verified against ProductPreview.java). Numeric
 * columns come back as strings from Drizzle (mode not overridden to
 * "number"), matching the `product.price` / `quantity` / `external_quantity`
 * numeric(...) columns in schema.ts.
 */
export interface ProductPreviewRow {
  id: bigint;
  version: bigint;
  subCategoryId: number;
  name: string;
  slug: string;
  sku: string;
  price: string;
  quantity: string;
  externalQuantity: string;
  unit: Unit;
  skuGroupId: number;
  specialStatusId: number | null;
  mainProductCheck: boolean;
  mainProductId: number | null;
  tagId: string;
  materialId: string;
  colorId: string;
  patternId: string | null;
  heroImage: string;
  hoverImage: string;
  heroImageAlt: string;
  hoverImageAlt: string;
  productOverview: string;
  productCare: string;
  metaDescription: string;
  productGroup: string;
  madeToOrderProfileId: number | null;
  madeToOrderProfileEnabled: boolean;
  madeToOrderFabricId: number | null;
  sizeProfileId: number | null;
  sizeProfileEnabled: boolean;
  volumeDiscountProfileId: number | null;
  volumeDiscountProfileEnabled: boolean;
  disabled: boolean;
  finishProfileId: number | null;
  finishProfileEnabled: boolean;
  finishProfileItemId: string | null;
  customSizeProfileId: number | null;
  customSizeProfileEnabled: boolean;
}

/**
 * Enriched view returned to callers. `category` / `segment` are @Transient
 * in source (populated on-demand, not eagerly joined) and `materials` /
 * `colors` / `patterns` are @Transient lists resolved from the
 * comma-separated *_id columns — all four are typed via Ports below since
 * their owning modules (Category, Segment, Material, Color, Pattern) are
 * out of scope for this migration. `totalQuantity` is the source's
 * @Transient computed field: quantity + externalQuantity.
 *
 * NOT source-verified against a real column: `productSpecificSizeProfile`
 * / `productSpecificSizeProfileEnabled` exist on ProductPreview.java but
 * have no corresponding column in the introspected `product` pgTable in
 * schema.ts. Omitted here rather than guessed at — add once the DB
 * migration that introduces those columns lands and schema.ts is
 * regenerated.
 */
export interface ProductPreviewView {
  id: number;
  version: number;
  subCategoryId: number;
  category: unknown | null;
  segment: unknown | null;
  name: string;
  slug: string;
  sku: string;
  price: number;
  quantity: number;
  externalQuantity: number;
  totalQuantity: number;
  unit: Unit;
  skuGroupId: number;
  specialStatusId: number | null;
  mainProductCheck: boolean;
  mainProductId: number | null;
  tagId: string;
  materialId: string;
  materials: unknown[];
  colorId: string;
  colors: unknown[];
  patternId: string;
  patterns: unknown[];
  heroImage: string;
  hoverImage: string;
  heroImageAlt: string;
  hoverImageAlt: string;
  productOverview: string;
  productCare: string;
  metaDescription: string;
  productGroup: string;
  madeToOrderProfileId: number | null;
  madeToOrderProfileEnabled: boolean;
  madeToOrderFabricId: number | null;
  sizeProfileId: number | null;
  sizeProfileEnabled: boolean;
  volumeDiscountProfileId: number | null;
  volumeDiscountProfileEnabled: boolean;
  disabled: boolean;
  finishProfileId: number | null;
  finishProfileEnabled: boolean;
  finishProfileItemId: string | null;
  customSizeProfileId: number | null;
  customSizeProfileEnabled: boolean;
}

/**
 * com.bloomscorp.loom.search.pojo.ProductSearchResult — projection returned
 * by the named native queries (findProductSearchResultBySKU,
 * findProductSearchResultsByColorId, etc.). The POJO itself is not in the
 * uploaded repository, so only the columns the native queries in
 * ProductPreviewJpaRepository are documented to select are included here;
 * anything beyond that would be invented.
 */
export interface ProductSearchResult {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: number;
  heroImage: string;
}

/**
 * Multi-facet filter args for findProductPreviewsByAllFilterIds — source
 * uses long[] with UNNEST/ANY over comma-separated id columns joined
 * through sub_category -> segment -> category. Empty arrays mean "don't
 * filter on this facet" (source-verified: empty array passed to = ANY()
 * matches nothing in Postgres for the join-column predicates, but the
 * EXISTS/UNNEST predicates on color/material use the array directly —
 * preserved verbatim in the repository, not reinterpreted here).
 */
export interface ProductPreviewFilterArgs {
  colorIds: number[];
  materialIds: number[];
  subCategoryIds: number[];
  segmentIds: number[];
  categoryIds: number[];
}

/**
 * Cross-module read-only dependencies ProductPreview enrichment calls into.
 * Category, Segment, SubCategory, SkuGroup, SpecialStatus, and
 * ProductSizeProfile are marked complete elsewhere in this migration, but
 * their NestJS module paths aren't available in this workspace slice —
 * wire real providers for these tokens in product.module.ts once those
 * modules are reachable, mirroring how cart.module.ts wires its ports.
 */
export interface MaterialLookupPort {
  retrieveByIds(ids: number[]): Promise<unknown[]>;
}

export interface ColorLookupPort {
  retrieveByIds(ids: number[]): Promise<unknown[]>;
}

export interface PatternLookupPort {
  retrieveByIds(ids: number[]): Promise<unknown[]>;
}

export interface CategoryLookupPort {
  retrieveForProduct(productId: number): Promise<unknown | null>;
}

export interface SegmentLookupPort {
  retrieveForProduct(productId: number): Promise<unknown | null>;
}

export const MATERIAL_LOOKUP_PORT = Symbol("MATERIAL_LOOKUP_PORT");
export const COLOR_LOOKUP_PORT = Symbol("COLOR_LOOKUP_PORT");
export const PATTERN_LOOKUP_PORT = Symbol("PATTERN_LOOKUP_PORT");
export const CATEGORY_LOOKUP_PORT = Symbol("CATEGORY_LOOKUP_PORT");
export const SEGMENT_LOOKUP_PORT = Symbol("SEGMENT_LOOKUP_PORT");

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
// @ts-nocheck
// @ts-nocheck
