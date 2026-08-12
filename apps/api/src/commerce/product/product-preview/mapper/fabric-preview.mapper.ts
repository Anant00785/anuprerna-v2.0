// @ts-nocheck
/**
 * apps/api/src/commerce/product/fabric-preview/mapper/fabric-preview.mapper.ts
 *
 * Translates raw `product_fabric` rows into the enriched FabricPreviewView
 * shape. The joined `product` (ProductPreview) is left null here — resolve
 * it via ProductPreviewLookupPort in the service layer, same pattern as
 * ProductPreview's own category/segment enrichment.
 */
import { productFabric } from "../../../../database/schema/schema.js";
import { FabricPreviewView } from "../types/fabric-preview.types.js";

type FabricProductRow = typeof productFabric.$inferSelect;

export function toView(row: FabricProductRow): FabricPreviewView {
  return {
    id: Number(row.id),
    version: Number(row.version),
    productId: Number(row.productId),
    product: null, // OneToOne in source; populated on-demand via ProductPreviewLookupPort
    gsm: row.gsm,
  };
}
