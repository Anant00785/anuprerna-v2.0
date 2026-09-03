/**
 * apps/api/src/commerce/product/fabric-preview/types/fabric-preview.types.ts
 *
 * Source-verified types for the FabricPreview module. Mirrors, field-for-field:
 *  - com.bloomscorp.loom.product.orm.FabricPreview
 *
 * FabricPreview maps onto FabricProductContract.TABLE = "product_fabric"
 * (see schema.ts `productFabric`), a OneToOne projection keyed by
 * product_id onto ProductPreview. Only `product` (the FK to ProductPreview)
 * and `gsm` are declared on the Java entity — `product_fabric` also has
 * `add_to_swatch` and `width` columns in schema.ts, but FabricPreview.java
 * deliberately does not map them (that's the point of the lean preview
 * projection vs. the full FabricProduct entity). Not included here for
 * that reason.
 */

export interface FabricPreviewRow {
  id: bigint;
  version: bigint;
  productId: number;
  gsm: number;
}

/**
 * Enriched view. `product` is the ProductPreview this fabric preview is
 * OneToOne-joined to (cascade = ALL in source); typed via Port since
 * ProductPreview enrichment/lookup happens through its own service.
 */
export interface FabricPreviewView {
  id: number;
  version: number;
  productId: number;
  product: unknown | null;
  gsm: number;
}

/** Port into the ProductPreview module for resolving the joined `product` field. */
export interface ProductPreviewLookupPort {
  retrieveEntity(id: number): Promise<unknown | null>;
  retrieveByProductId(productId: number): Promise<unknown | null>;
}

export const PRODUCT_PREVIEW_LOOKUP_PORT = Symbol("PRODUCT_PREVIEW_LOOKUP_PORT");
