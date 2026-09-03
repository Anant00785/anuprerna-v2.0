import type { ProductInput } from "../../product/types/product.types.js";
/**
 * apps/api/src/product/finished-product/types/finished-product.types.ts
 *
 * Source-verified types for the FinishedProduct module. Mirrors, field-for-field:
 *  - com.bloomscorp.loom.product.orm.FinishedProduct
 *  - com.bloomscorp.loom.product.contract.FinishedProductContract
 *  - com.bloomscorp.loom.product.product.pojo.FinishedProductData
 *  - com.bloomscorp.loom.product.product.pojo.ProductDisableRequest
 *  - com.bloomscorp.loom.product.product.pojo.ProductZohoTriggerData
 *
 * `@anuprerna/types` is an empty workspace stub and this project has no zod
 * (or any validation library) dependency installed (verified: package.json
 * lists neither), so — same as the Cart module — these are plain TS types
 * with hand-written runtime guards in validator/finished-product.validator.ts,
 * rather than a zod schema.
 *
 * IMPORTANT ASSUMPTION (flagged, not silently invented): the completed
 * Product and FabricProduct modules were NOT uploaded into this conversation
 * — only their Java source was available, not their generated TypeScript.
 * FinishedProduct's own DB row (`product_finished`) has exactly one column
 * besides id/version: `product_id` (source-verified: FinishedProduct.java
 * has a single `@OneToOne` field to `Product`; FinishedProductContract.java
 * declares only TABLE and PRODUCT_ID). Because the real `Product`
 * input/view TypeScript shape isn't available here, the nested product
 * payload is typed `unknown` and routed through `ProductPort` — the same
 * pattern the Cart module uses for FabricPreviewPort/FinishedPreviewPort.
 * Swap `ProductPort` for the real ProductService/ProductRepository once
 * their exported types can be shared into this conversation; nothing here
 * should be "completed" by guessing Product's ~30-field shape.
 */

/**
 * com.bloomscorp.loom.product.product.pojo.FinishedProductData — flat
 * projection returned by the table-explorer endpoint. Field order matches
 * FinishedProductDataNativeQuery.RETRIEVE_FINISHED_PRODUCT column order
 * (significant for the source @ConstructorResult mapping; preserved for
 * parity, not required in TS).
 */
export interface FinishedProductData {
  id: number;
  version: number;
  productId: number;
}

/**
 * Inbound shape for create/update requests. Mirrors what
 * FinishedProductController#createFinishedProduct / #updateFinishedProduct
 * accept as `@RequestBody FinishedProduct finishedProduct`. `product` is the
 * nested Product payload — out of scope for this module (see file header).
 */
export interface FinishedProductInput {
  id?: number; // required for update, absent for create
  product: ProductInput;
}

export interface UpdateFinishedProductInput extends FinishedProductInput {
  id: number;
}

/** com.bloomscorp.loom.product.product.pojo.ProductDisableRequest */
export interface ProductDisableRequest {
  productId: number;
  disable: boolean;
}

/**
 * com.bloomscorp.loom.product.product.pojo.ProductZohoTriggerData.
 * `productZohoRelationList` items are typed as the minimal shape
 * FinishedProductDAOController#disableFinishedProduct actually reads
 * (id, sku, disabled) — the full ProductZohoRelation entity belongs to a
 * module not yet migrated (see ProductZohoRelationPort below).
 */
export interface ProductZohoRelationLite {
  id: number;
  sku: string;
  disabled: boolean;
}

export interface ProductZohoTriggerData {
  productId: number;
  productZohoRelationList: ProductZohoRelationLite[];
}

/**
 * Cross-module dependencies (Product, Color, Material, Pattern, Tag,
 * MainProductPreview, SizeProfile, Zoho, ProductZohoRelation,
 * ProductSizeProfile) that FinishedProductDAOController calls into. All are
 * out of scope for this migration per the brief — narrow ports typed
 * exactly to the calls FinishedProduct actually makes. Wire real providers
 * in finished-product.module.ts as each module gets migrated.
 *
 * ProductPort specifically stands in for the real, already-migrated
 * ProductService/ProductRepository — see the file header note on why it's
 * a port rather than a direct import.
 */
export interface ProductPort {
  /**
   * ProductDAOController#createProduct(entity) followed by the JPA cascade
   * save that source relies on (FinishedProduct.product is
   * `cascade = CascadeType.ALL`). That cascade has no Drizzle equivalent,
   * so this port method is expected to fully persist the product and
   * return its generated id — see finished-product.service.ts.
   */
  createProduct(input: unknown): Promise<{ id: number } | null>;
  /** ProductDAOController#updateProduct(updatedProduct) — returns an ActionCode. */
  updateProduct(input: unknown): Promise<number>;
  /** ProductDAOController#updateProductInternal(product) — returns an ActionCode. */
  updateProductInternal(productId: number, disabled: boolean): Promise<number>;
  /** ProductJpaRepository#findProductBySlug(slug) */
  findProductBySlug(slug: string): Promise<({ id: number } & Record<string, unknown>) | null>;
  /** ProductDAOController#retrieveProduct(id) (adds totalQuantity) */
  retrieveProduct(id: number): Promise<({ id: number } & Record<string, unknown>) | null>;
  /** Product#getProductZohoRelationList() as read by disableFinishedProduct */
  getZohoRelations(productId: number): Promise<ProductZohoRelationLite[]>;
}

export interface ColorPort {
  retrieveEntity(id: number): Promise<unknown | null>;
}

export interface MaterialPort {
  retrieveEntity(id: number): Promise<unknown | null>;
}

export interface PatternPort {
  retrieveEntity(id: number): Promise<unknown | null>;
}

export interface TagPort {
  retrieveEntity(id: number): Promise<unknown | null>;
}

/** MainProductPreviewDAOController#prepareRelatedProductList(product) */
export interface MainProductPreviewPort {
  prepareRelatedProductList(productId: number): Promise<unknown[]>;
}

/** SizeProfileDAOController#prepareSizeProfile(sizeProfile) */
export interface SizeProfilePort {
  prepareSizeProfile(sizeProfileId: number): Promise<unknown | null>;
}

/**
 * ZohoItemAdapterService — external Zoho CRM integration. Behavior lives
 * entirely outside this repository (not found in current upload); flagged
 * rather than invented. Ports the three call sites FinishedProductDAOController
 * actually uses.
 */
export interface ZohoAdapterPort {
  addFinishedProductToZoho(tenantId: number, finishedProductId: number): Promise<void>;
  updateFinishedProductToZoho(tenantId: number, finishedProductId: number): Promise<void>;
  reTriggerFinishedProductToZohoWorkflow(tenantId: number, finishedProductId: number): Promise<void>;
}

export interface ProductZohoRelationPort {
  setDisabled(relationId: number, disabled: boolean): Promise<void>;
}

/** ProductSizeProfileJpaRepository#findProductSizeProfileBySizeProfileOptionSku(sku) */
export interface ProductSizeProfilePort {
  findBySizeProfileOptionSku(sku: string): Promise<{ disabled: boolean } | null>;
}

/**
 * Ports the LogMessage constants FinishedProductController actually uses
 * (source: com.bloomscorp.loom.support.LogMessage —
 * UNAUTH_FINISHED_PRODUCT_CREATE_REQUEST, NEW_FINISHED_PRODUCT_CREATED,
 * UNAUTH_FINISHED_PRODUCT_UPDATE_REQUEST, FINISHED_PRODUCT_UPDATED,
 * UNAUTH_FINISHED_PRODUCT_ZOHO_TRIGGER_REQUEST, FINISHED_PRODUCT_ZOHO_TRIGGERED,
 * UNAUTH_TABLE_EXPLORER_PRODUCT_FINISHED_REQUEST) so response `message`
 * strings stay byte-identical to what existing clients already parse/display.
 * No controller is generated in this pass (none requested), but these are
 * kept here — same as Cart's CartMessages — for the controller that will
 * wire up later.
 */
export const FinishedProductMessages = {
  UNAUTH_FINISHED_PRODUCT_CREATE_REQUEST: "Unauthorized attempt to create a finished product.",
  NEW_FINISHED_PRODUCT_CREATED: "Finished product created successfully.",
  FINISHED_PRODUCT_CREATE_FAILED: "Failed to create finished product.",
  UNAUTH_FINISHED_PRODUCT_UPDATE_REQUEST: "Unauthorized attempt to update a finished product.",
  FINISHED_PRODUCT_UPDATED: "Finished product updated successfully.",
  FINISHED_PRODUCT_UPDATE_FAILED: "Failed to update finished product.",
  UNAUTH_FINISHED_PRODUCT_ZOHO_TRIGGER_REQUEST: "Unauthorized attempt to trigger finished product Zoho workflow.",
  FINISHED_PRODUCT_ZOHO_TRIGGERED: "Finished product Zoho workflow triggered successfully.",
  UNAUTH_TABLE_EXPLORER_PRODUCT_FINISHED_REQUEST: "Unauthorized access to table explorer finished product list.",
} as const;

export const PRODUCT_PORT = Symbol("PRODUCT_PORT");
export const COLOR_PORT = Symbol("COLOR_PORT");
export const MATERIAL_PORT = Symbol("MATERIAL_PORT");
export const PATTERN_PORT = Symbol("PATTERN_PORT");
export const TAG_PORT = Symbol("TAG_PORT");
export const MAIN_PRODUCT_PREVIEW_PORT = Symbol("MAIN_PRODUCT_PREVIEW_PORT");
export const SIZE_PROFILE_PORT = Symbol("SIZE_PROFILE_PORT");
export const ZOHO_ADAPTER_PORT = Symbol("ZOHO_ADAPTER_PORT");
export const PRODUCT_ZOHO_RELATION_PORT = Symbol("PRODUCT_ZOHO_RELATION_PORT");
export const PRODUCT_SIZE_PROFILE_PORT = Symbol("PRODUCT_SIZE_PROFILE_PORT");
