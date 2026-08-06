/**
 * apps/api/src/commerce/product/product-preview/mapper/product-preview.mapper.ts
 *
 * Translates raw `product` rows (as selected via the ProductPreview
 * repository) into the enriched ProductPreviewView shape. Numeric-as-string
 * Drizzle columns (price/quantity/externalQuantity) are converted to
 * numbers here; totalQuantity is computed exactly as ProductPreview's
 * @Transient getter does: quantity + externalQuantity.
 */
import { product } from "../../../../database/schema/schema.js";
import { ProductPreviewView, parseIdList } from "../types/product-preview.types.js";

type ProductRow = typeof product.$inferSelect;

/** ProductPreview's implicit row -> entity mapping (Hibernate does this for free; ported explicitly here). */
export function toView(row: ProductRow): ProductPreviewView {
  const quantity = Number(row.quantity);
  const externalQuantity = Number(row.externalQuantity);

  return {
    id: Number(row.id),
    version: Number(row.version),
    subCategoryId: Number(row.subCategoryId),
    category: null, // @Transient in source, populated on-demand via CategoryLookupPort
    segment: null, // @Transient in source, populated on-demand via SegmentLookupPort
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    price: Number(row.price),
    quantity,
    externalQuantity,
    totalQuantity: quantity + externalQuantity,
    unit: row.unit as ProductPreviewView["unit"],
    skuGroupId: Number(row.skuGroupId),
    specialStatusId: row.specialStatusId === null ? null : Number(row.specialStatusId),
    mainProductCheck: row.mainProductCheck,
    mainProductId: row.mainProductId === null ? null : Number(row.mainProductId),
    tagId: row.tagId ?? "",
    materialId: row.materialId,
    materials: [], // @Transient in source, populated on-demand via MaterialLookupPort
    colorId: row.colorId,
    colors: [], // @Transient in source, populated on-demand via ColorLookupPort
    patternId: row.patternId ?? "",
    patterns: [], // @Transient in source, populated on-demand via PatternLookupPort
    heroImage: row.heroImage ?? "",
    hoverImage: row.hoverImage ?? "",
    heroImageAlt: row.heroImageAlt,
    hoverImageAlt: row.hoverImageAlt,
    productOverview: row.productOverview,
    productCare: row.productCare,
    metaDescription: row.metaDescription,
    productGroup: row.productGroup,
    madeToOrderProfileId: row.madeToOrderProfileId === null ? null : Number(row.madeToOrderProfileId),
    madeToOrderProfileEnabled: row.madeToOrderProfileEnabled,
    madeToOrderFabricId: row.madeToOrderFabricId === null ? null : Number(row.madeToOrderFabricId),
    sizeProfileId: row.sizeProfileId === null ? null : Number(row.sizeProfileId),
    sizeProfileEnabled: row.sizeProfileEnabled,
    volumeDiscountProfileId: row.volumeDiscountProfileId === null ? null : Number(row.volumeDiscountProfileId),
    volumeDiscountProfileEnabled: row.volumeDiscountProfileEnabled,
    disabled: row.disabled,
    finishProfileId: row.finishProfileId === null ? null : Number(row.finishProfileId),
    finishProfileEnabled: row.finishProfileEnabled,
    finishProfileItemId: row.finishProfileItemId,
    customSizeProfileId: row.customSizeProfileId === null ? null : Number(row.customSizeProfileId),
    customSizeProfileEnabled: row.customSizeProfileEnabled,
  };
}

/** Convenience re-export so callers of the mapper don't need a second import for id-list parsing. */
export { parseIdList };
