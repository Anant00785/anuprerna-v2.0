/**
 * apps/api/src/commerce/product/review-product-preview/mapper/review-product-preview.mapper.ts
 *
 * Translates raw `product` rows (restricted to the columns
 * ReviewProductPreview projects) into ReviewProductPreviewView.
 */
import { product } from "../../../../database/schema/schema.js";
import { ReviewProductPreviewView } from "../types/review-product-preview.types.js";

type ProductRow = typeof product.$inferSelect;

export function toView(row: ProductRow): ReviewProductPreviewView {
  return {
    id: Number(row.id),
    version: Number(row.version),
    subCategoryId: Number(row.subCategoryId),
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    heroImage: row.heroImage ?? "",
    productGroup: row.productGroup,
  };
}
// @ts-nocheck
// @ts-nocheck
