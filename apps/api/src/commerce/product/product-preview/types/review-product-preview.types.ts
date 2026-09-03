/**
 * apps/api/src/commerce/product/review-product-preview/types/review-product-preview.types.ts
 *
 * Source-verified types for the ReviewProductPreview module. Mirrors, field-for-field:
 *  - com.bloomscorp.loom.product.product.orm.ReviewProductPreview
 *
 * ReviewProductPreview maps onto the SAME table as Product (ProductContract.TABLE
 * = "product", see schema.ts `product`) — a lean projection for rendering
 * products alongside customer reviews/ratings.
 */

export interface ReviewProductPreviewRow {
  id: bigint;
  version: bigint;
  subCategoryId: number;
  name: string;
  slug: string;
  sku: string;
  heroImage: string;
  productGroup: string;
}

export interface ReviewProductPreviewView {
  id: number;
  version: number;
  subCategoryId: number;
  name: string;
  slug: string;
  sku: string;
  heroImage: string;
  productGroup: string;
}
