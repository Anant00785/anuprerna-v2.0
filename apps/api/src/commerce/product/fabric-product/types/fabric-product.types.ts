// @ts-nocheck
/**
 * apps/api/src/commerce/product/fabric-product/fabric-product.types.ts
 *
 * Canonical type definitions for the FabricProduct domain. Reconstructed
 * field-for-field from:
 *  - com.bloomscorp.loom.product.orm.FabricProduct
 *  - com.bloomscorp.loom.product.contract.FabricProductContract
 *  - com.bloomscorp.loom.product.pojo.FabricProductData / FabricOverview
 *  - database/schema/schema.ts (the `product_fabric` pgTable)
 *  - com.bloomscorp.loom.product.nativequery.FabricProductNativeQuery's
 *    @SqlResultSetMapping column lists (for FabricFilterPreview — see note
 *    below)
 *
 * REUSE: FabricProduct wraps core Product Core (`../../../product/core/`)
 * exactly as the Java entity does (`FabricProduct.product: Product`, a
 * `@OneToOne` onto the same `Product` this repository already ported).
 * `ProductInput` / `ProductView` are imported and embedded, not
 * redeclared — per the brief's "never duplicate files" rule.
 *
 * SOURCE GAP (flagged, not silently invented): `FabricFilterPreview` —
 * the target class of FIND_FABRIC_FILTER_PREVIEW / _PAGE / _BY_IDS /
 * _FILTERED — lives in `com.bloomscorp.loom.filter.pojo`, a package not
 * present anywhere in the uploaded repository. Its field set below is
 * reconstructed from the fully source-verified `@ColumnResult` list on
 * `FabricProductNativeQuery.SQL_RESULT_SET_MAPPER` (types and names are
 * exact), but the class body itself (getters, any derived logic) is not
 * source-verified. Confirm against the real class if one exists outside
 * this repository snapshot.
 *
 * SOURCE GAP (flagged): `com.bloomscorp.loom.nverse.validator.FabricProductValidator`
 * and `com.bloomscorp.loom.nverse.sanitizer.FabricProductSanitizer`
 * (referenced by FabricProductController) live in the `com.bloomscorp.loom.nverse`
 * framework package, which — like `com.bloomscorp.nverse.validator.NVerseValidator`/
 * `NVerseSanitizer` before it — is not present in the uploaded repository.
 * Same treatment as Product Core's own validator/sanitizer gap: see
 * fabric-product.validator.ts / fabric-product.sanitizer.ts headers.
 */
import {
  ProductInput,
  ProductView,
} from  "../../product/types/product.types.js";

/**
 * Inbound shape for create/update FabricProduct requests. Mirrors
 * `FabricProduct` as bound from the request body in
 * FabricProductController#createFabricProduct/#updateFabricProduct
 * (`@RequestBody FabricProduct fabricProduct`) — the nested `product`
 * field is the same shape Product Core's own create/update endpoints
 * accept, with `productGroup` always forced to `"fabric"` by
 * `createFabricProduct` (`product.setProductGroup("fabric")`) before
 * being handed to Product Core — ported as-is in fabric-product.mapper.ts.
 */
export interface FabricProductInput {
  id?: number; // required for update, absent for create
  gsm: number;
  addToSwatch?: boolean; // DB default true
  width: string;
  product: ProductInput;
}

/**
 * com.bloomscorp.loom.product.pojo.FabricProductData — flat projection
 * returned by FabricProductDataNativeQuery.RETRIEVE_FABRIC_PRODUCT_DATA.
 */
export interface FabricProductData {
  id: number;
  version: number;
  productId: number;
  gsm: number;
  addToSwatch: boolean;
  width: string;
}

/**
 * com.bloomscorp.loom.product.pojo.FabricOverview — flat projection
 * returned by the `findFabricOverview` named native query. Field names
 * match the native query's column aliases exactly (snake_case
 * @AllArgsConstructor properties, same convention as ProductGist —
 * preserved as-is, not re-mapped to camelCase).
 */
export interface FabricOverview {
  id: number;
  gsm: number;
  product_id: number;
  sku: string;
  name: string;
  price: number;
  hero_image: string;
  hover_image: string;
  slug: string;
  unit: string;
  material: string;
  color: string;
  pattern: string;
  quantity: number;
  segment_category: string | null;
  segment_category_id: number | null;
  sub_category: string | null;
  sub_category_id: number | null;
  special_status: string | null;
  external_quantity: number;
  total_quantity: number;
  disabled: boolean;
  sku_group: string | null;
  sku_group_id: number | null;
  category_id: number | null;
  category: string | null;
}

/**
 * FabricFilterPreview — see file header source-gap note. Field set/types
 * are exact per @ColumnResult; nullability inferred from the LEFT JOINs
 * in the source SQL (anything joined via `left join` can be null).
 */
export interface FabricFilterPreview {
  id: number;
  gsm: number;
  product_id: number;
  sku: string;
  name: string;
  price: number;
  hero_image: string;
  hover_image: string;
  slug: string;
  unit: string;
  material: string;
  color: string;
  pattern: string;
  quantity: number;
  is_main_product: boolean;
  segment_category: string | null;
  sub_category: string | null;
  category: string | null;
  special_status: string | null;
  volume_discount: number | null;
  volume_discount_minimum_order_quantity: number | null;
  consumed_fabric: number | null;
  minimum_order_quantity: number | null;
  finish_profile_item_list: unknown | null;
  max_discount_product_price: number | null;
  max_discount_product_discount: number | null;
  made_to_order_fabric_quantity: number | null;
  external_quantity: number;
  total_quantity: number;
  product_group: string;
}

/** Filter params for FIND_FABRIC_FILTER_PREVIEW_FILTERED — comma-separated id/name lists, verbatim source contract. */
export interface FabricFilterPreviewFilters {
  colors?: string | null;
  materials?: string | null;
  patterns?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minGSM?: number | null;
  maxGSM?: number | null;
  segments?: string | null;
  subCategories?: string | null;
  limit: number;
  offset: number;
}

/**
 * Enriched FabricProduct as returned by retrieveFabricProduct /
 * retrieveFabricProductBySlug(V2) — mirrors the object graph
 * FabricProductDAOController assembles across those three (near-
 * identical) methods: base row + fabric row, plus every `prepare*`
 * enrichment call. See fabric-product.service.ts for exactly which
 * enrichments are live vs. behind a dummy Port pending their own
 * migration step.
 */
export interface FabricProductView {
  id: number;
  version: number;
  productId: number;
  gsm: number;
  addToSwatch: boolean;
  width: string;
  product: ProductView;
  /** prepareColor(fabricProduct) */
  colors: unknown[];
  /** prepareMaterial(fabricProduct) */
  materials: unknown[];
  /** preparePattern(fabricProduct) */
  patterns: unknown[];
  /** prepareTag(fabricProduct) */
  tags: unknown[];
  /** mainProductPreviewDAOController.prepareRelatedProductList(product) */
  relatedProductList: unknown[];
  /** sizeProfileDAOController.prepareSizeProfile(product.sizeProfile), only when product.sizeProfile is set */
  sizeProfile: unknown | null;
  /** product.subCategory.segment.category, hoisted onto the product per source */
  category: unknown | null;
  /** product.subCategory.segment, hoisted onto the product per source (with its own .category nulled out, matching `entity.getProduct().getSegment().setCategory(null)`) */
  segment: unknown | null;
  /** product.madeToOrderFabric, with its own transient totalQuantity computed — a real Product Core row, not a Port (see service doc) */
  madeToOrderFabric: (ProductView & { totalQuantity: number }) | null;
  /** product.fabricProfile.fabricProfileItemList, each item's fabricPreview enriched with totalQuantity */
  fabricProfileItems: unknown[];
  /** product.imageGallerySEOList, each row's `product` back-reference nulled out (`imageSeo.setProduct(null)`) */
  imageGallerySEOList: unknown[];
}

export interface ProductDisableRequestInput {
  productId: number;
  disable: boolean;
}

/**
 * com.bloomscorp.loom.product.product.pojo.ProductZohoTriggerData.
 * `productZohoRelationList`'s row shape belongs to the not-yet-migrated
 * ProductZohoRelation domain — typed `unknown[]` and passed through
 * unopened, exactly as triggerZohoWorkflow does
 * (`fabricProduct.getProduct().setProductZohoRelationList(data.getProductZohoRelationList())`
 * — a straight reassignment, no field access).
 */
export interface ProductZohoTriggerDataInput {
  productId: number;
  productZohoRelationList: unknown[];
}

/**
 * Cross-module dependencies FabricProductDAOController calls into that are
 * genuinely out of scope for this migration step (Color, Material,
 * Pattern, Tag, ProductPreview, Profile, ProductZohoRelation, and the
 * external Zoho adapter service). Narrow ports typed exactly to the calls
 * the source makes. Wire real providers in fabric-product.module.ts as
 * each dependency module gets migrated — same pattern as
 * commerce/cart/cart.module.ts and product/core/Product.module.ts.
 */
export interface ColorPort {
  /** ColorDAOController#retrieveEntity(id) */
  retrieveEntity(id: number): Promise<unknown | null>;
}

export interface MaterialPort {
  /** MaterialDAOController#retrieveEntity(id) */
  retrieveEntity(id: number): Promise<unknown | null>;
}

export interface PatternPort {
  /** PatternDAOController#retrieveEntity(id) */
  retrieveEntity(id: number): Promise<unknown | null>;
}

export interface TagPort {
  /** TagDAOController#retrieveEntity(id) — Tag is marked complete in MIGRATION_CHECKPOINT.md, but its TS output wasn't available to import here; see module header. */
  retrieveEntity(id: number): Promise<unknown | null>;
}

export interface MainProductPreviewPort {
  /** MainProductPreviewDAOController#prepareRelatedProductList(product) — source mutates product.relatedProductList in place; ported as a lookup returning the list. */
  prepareRelatedProductList(productId: number): Promise<unknown[]>;
}

export interface SizeProfilePreparePort {
  /** SizeProfileDAOController#prepareSizeProfile(sizeProfile) */
  prepareSizeProfile(sizeProfileId: number): Promise<unknown | null>;
}

export interface FabricProfileEnrichPort {
  /**
   * FabricProfileDAOController-adjacent enrichment: source loads
   * product.fabricProfile.fabricProfileItemList and sets each item's
   * fabricPreview.totalQuantity = quantity + externalQuantity in place.
   * Ported as a lookup returning the already-enriched item list for a
   * given fabricProfileId.
   */
  retrieveEnrichedItems(fabricProfileId: number): Promise<unknown[]>;
}

/** SubCategory → Segment → Category hierarchy hoist (see FabricProductView.category/segment doc). SubCategory is marked complete but not importable here — see module header. */
export interface SubCategoryHierarchyPort {
  retrieveHierarchy(subCategoryId: number): Promise<{ subCategory: unknown; segment: unknown; category: unknown } | null>;
}

/**
 * ProductZohoRelation persistence/lookup — its own migration step.
 * disableFabricProduct needs "every Zoho relation row for this product",
 * a query shape Product Core's own (narrower) ProductZohoRelationPort
 * doesn't expose, so this domain defines its own port rather than
 * widening Product Core's (leaving that file untouched per the brief).
 */
export interface FabricProductZohoRelationPort {
  /** ProductZohoRelationJpaRepository — all rows for a product (source: `updatedProduct.getProductZohoRelationList()`, the entity's eager @OneToMany). */
  findAllByProductId(productId: number): Promise<{ id: number }[]>;
  /** ProductZohoRelationDAOController#modifyEntity(relation) after setDisabled(...). */
  setDisabled(relationId: number, disabled: boolean): Promise<void>;
}

/**
 * ZohoItemAdapterService — external Zoho CRM integration
 * (com.bloomscorp.loom.zoho_adapter.item.service), not present in this
 * repository. Ported as a port bound to a no-op dummy, same treatment as
 * Auth0ValidationPort in auth.module.ts.
 */
export interface ZohoAdapterPort {
  /** addFabricProductToZoho(tenant, fabricProduct) */
  addFabricProductToZoho(tenantId: number, fabricProductId: number): Promise<void>;
  /** updateFabricProductToZoho(tenant, updatedEntity) */
  updateFabricProductToZoho(tenantId: number, fabricProductId: number): Promise<void>;
  /** reTriggerFabricProductToZohoWorkflow(tenant, fabricProduct) */
  reTriggerFabricProductToZohoWorkflow(tenantId: number, fabricProductId: number): Promise<void>;
}

export const COLOR_PORT = Symbol("COLOR_PORT");
export const MATERIAL_PORT = Symbol("MATERIAL_PORT");
export const PATTERN_PORT = Symbol("PATTERN_PORT");
export const TAG_PORT = Symbol("TAG_PORT");
export const MAIN_PRODUCT_PREVIEW_PORT = Symbol("MAIN_PRODUCT_PREVIEW_PORT");
export const SIZE_PROFILE_PREPARE_PORT = Symbol("SIZE_PROFILE_PREPARE_PORT");
export const FABRIC_PROFILE_ENRICH_PORT = Symbol("FABRIC_PROFILE_ENRICH_PORT");
export const SUB_CATEGORY_HIERARCHY_PORT = Symbol("SUB_CATEGORY_HIERARCHY_PORT");
export const FABRIC_PRODUCT_ZOHO_RELATION_PORT = Symbol("FABRIC_PRODUCT_ZOHO_RELATION_PORT");
export const ZOHO_ADAPTER_PORT = Symbol("ZOHO_ADAPTER_PORT");
// @ts-nocheck
// @ts-nocheck
