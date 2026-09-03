/**
 * apps/api/src/commerce/product/nav-product-preview/mapper/nav-product-preview.mapper.ts
 *
 * Translates raw `product` rows (restricted to the columns
 * NavProductPreview projects) into NavProductPreviewView.
 */
import { product } from "../../../../database/schema/schema.js";
import { NavProductPreviewView } from "../types/nav-product-preview.types.js";

type ProductRow = typeof product.$inferSelect;

export function toView(row: ProductRow): NavProductPreviewView {
  return {
    id: Number(row.id),
    version: Number(row.version),
    subCategoryId: Number(row.subCategoryId),
    category: null,
    segment: null,
    slug: row.slug,
    materialId: row.materialId,
    materials: [], // @Transient in source, populated on-demand via MaterialLookupPort
    colorId: row.colorId,
    colors: [], // @Transient in source, populated on-demand via ColorLookupPort
    patternId: row.patternId ?? "",
    patterns: [], // @Transient in source, populated on-demand via PatternLookupPort
    heroImage: row.heroImage ?? "",
    productGroup: row.productGroup,
    disabled: row.disabled,
  };
}
