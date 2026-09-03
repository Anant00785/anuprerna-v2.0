/**
 * apps/api/src/commerce/product/finished-preview/mapper/finished-preview.mapper.ts
 *
 * Translates raw `product_finished` rows into the enriched
 * FinishedPreviewView shape. The joined `product` (ProductPreview) is left
 * null here — resolve it via ProductPreviewLookupPort in the service layer.
 */
import { productFinished } from "../../../../database/schema/schema.js";
import { FinishedPreviewView } from "../types/finished-preview.types.js";

type FinishedProductRow = typeof productFinished.$inferSelect;

export function toView(row: FinishedProductRow): FinishedPreviewView {
  return {
    id: Number(row.id),
    version: Number(row.version),
    productId: Number(row.productId),
    product: null, // OneToOne in source; populated on-demand via ProductPreviewLookupPort
  };
}
