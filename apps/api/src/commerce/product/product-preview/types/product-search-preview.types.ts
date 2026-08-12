/**
 * apps/api/src/commerce/product/product-search-preview/types/product-search-preview.types.ts
 *
 * Source-verified types for the ProductSearchPreview module. Mirrors, field-for-field:
 *  - com.bloomscorp.loom.product.orm.ProductSearchPreview
 *
 * ProductSearchPreview maps onto the SAME table as Product (ProductContract.TABLE
 * = "product", see schema.ts `product`) — the smallest of the preview
 * projections, for autocomplete/typeahead and admin dropdowns.
 *
 * NOT source-verified: the uploaded Java source contains only
 * ProductSearchPreview.java (the @Entity). No
 * ProductSearchPreviewJpaRepository, service, or controller exists in this
 * upload, unlike every other preview in this migration. The
 * repository/service generated for this domain are therefore a minimal,
 * clearly-flagged reconstruction — CRUD-style reads only, no invented
 * business methods — rather than a 1:1 port. Confirm against the real
 * repository/service/controller (if any) before treating this as a public
 * contract.
 */

export interface ProductSearchPreviewRow {
  id: bigint;
  version: bigint;
  name: string;
  sku: string;
  price: string;
  skuGroupId: number;
  specialStatusId: number | null;
  mainProductCheck: boolean;
  mainProductId: number | null;
}

export interface ProductSearchPreviewView {
  id: number;
  version: number;
  name: string;
  sku: string;
  price: number;
  skuGroupId: number;
  specialStatusId: number | null;
  mainProductCheck: boolean;
  mainProductId: number | null;
}
// @ts-nocheck
// @ts-nocheck
