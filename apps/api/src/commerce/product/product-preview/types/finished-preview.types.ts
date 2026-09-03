/**
 * apps/api/src/commerce/product/finished-preview/types/finished-preview.types.ts
 *
 * Source-verified types for the FinishedPreview module. Mirrors, field-for-field:
 *  - com.bloomscorp.loom.product.orm.FinishedPreview
 *
 * FinishedPreview maps onto FinishedProductContract.TABLE = "product_finished"
 * (see schema.ts `productFinished`), a OneToOne projection keyed by
 * product_id onto ProductPreview. The Java entity declares no fields of
 * its own beyond the `product` join — it exists purely as a type marker
 * distinguishing finished-goods products from fabric products.
 */

export interface FinishedPreviewRow {
  id: bigint;
  version: bigint;
  productId: number;
}

export interface FinishedPreviewView {
  id: number;
  version: number;
  productId: number;
  product: unknown | null;
}

/** Port into the ProductPreview module for resolving the joined `product` field. */
export interface ProductPreviewLookupPort {
  retrieveEntity(id: number): Promise<unknown | null>;
  retrieveByProductId(productId: number): Promise<unknown | null>;
}

export const PRODUCT_PREVIEW_LOOKUP_PORT = Symbol("PRODUCT_PREVIEW_LOOKUP_PORT");
