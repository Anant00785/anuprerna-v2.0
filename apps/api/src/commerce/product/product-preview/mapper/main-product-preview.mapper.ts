/**
 * apps/api/src/commerce/product/main-product-preview/mapper/main-product-preview.mapper.ts
 *
 * Translates raw `product` rows (restricted to the columns
 * MainProductPreview projects) into MainProductPreviewView.
 */
import { product } from "../../../../database/schema/schema.js";
import { MainProductPreviewView } from "../types/main-product-preview.types.js";

type ProductRow = typeof product.$inferSelect;

export function toView(row: ProductRow): MainProductPreviewView {
  return {
    id: Number(row.id),
    version: Number(row.version),
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    mainProductCheck: row.mainProductCheck,
    mainProductId: row.mainProductId === null ? null : Number(row.mainProductId),
    heroImage: row.heroImage ?? "",
    disabled: row.disabled,
  };
}
// @ts-nocheck
// @ts-nocheck
