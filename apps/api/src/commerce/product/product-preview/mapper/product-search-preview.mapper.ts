/**
 * apps/api/src/commerce/product/product-search-preview/mapper/product-search-preview.mapper.ts
 *
 * Translates raw `product` rows (restricted to the columns
 * ProductSearchPreview projects) into ProductSearchPreviewView.
 */
import { product } from "../../../../database/schema/schema.js";
import { ProductSearchPreviewView } from "../types/product-search-preview.types.js";

type ProductRow = typeof product.$inferSelect;

export function toView(row: ProductRow): ProductSearchPreviewView {
  return {
    id: Number(row.id),
    version: Number(row.version),
    name: row.name,
    sku: row.sku,
    price: Number(row.price),
    skuGroupId: Number(row.skuGroupId),
    specialStatusId: row.specialStatusId === null ? null : Number(row.specialStatusId),
    mainProductCheck: row.mainProductCheck,
    mainProductId: row.mainProductId === null ? null : Number(row.mainProductId),
  };
}
