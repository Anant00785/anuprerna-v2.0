/**
 * apps/api/src/commerce/product/main-product-preview/types/main-product-preview.types.ts
 *
 * Source-verified types for the MainProductPreview module. Mirrors, field-for-field:
 *  - com.bloomscorp.loom.product.product.orm.MainProductPreview
 *
 * MainProductPreview maps onto the SAME table as Product (ProductContract.TABLE
 * = "product", see schema.ts `product`) — a lean JPA projection supporting
 * the main-product / variant-product pattern:
 *  - Main product: mainProductCheck = true, mainProductId = null
 *  - Variant product: mainProductCheck = false, mainProductId = [main product's id]
 *  - Standalone product: mainProductCheck = true, mainProductId = null, no variants
 */

export interface MainProductPreviewRow {
  id: bigint;
  version: bigint;
  name: string;
  slug: string;
  sku: string;
  mainProductCheck: boolean;
  mainProductId: number | null;
  heroImage: string;
  disabled: boolean;
}

export interface MainProductPreviewView {
  id: number;
  version: number;
  name: string;
  slug: string;
  sku: string;
  mainProductCheck: boolean;
  mainProductId: number | null;
  heroImage: string;
  disabled: boolean;
}
