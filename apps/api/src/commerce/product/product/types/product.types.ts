/**
 * apps/api/src/product/core/types/Product.types.ts
 *
 * Canonical type definitions for the Product Core module. Reconstructed
 * field-for-field from:
 *  - com.bloomscorp.loom.product.orm.Product
 *  - com.bloomscorp.loom.product.contract.ProductContract
 *  - com.bloomscorp.loom.product.pojo.ProductData / ProductGist / RelatedProducts
 *  - database/schema/schema.ts (the `product` pgTable) — the actual
 *    introspected Postgres truth this repository queries against.
 *
 * SCOPE NOTE: this is "Product Core" only — the `product` table itself.
 * Child/related tables each get their own migration step per
 * MIGRATION_CHECKPOINT.md (FabricProduct, FinishedProduct, CustomProduct,
 * ProductSizeProfile, ProductZohoRelation, ProductPreview). Their real
 * shapes aren't guessed at here; every field/relationship this module
 * touches on those tables is behind a narrow Port (see bottom of this
 * file), exactly like commerce/cart's FabricPreviewPort/etc. pattern.
 *
 * SubCategory / SkuGroup / SpecialStatus are marked complete in the
 * migration brief, but their TypeScript output was not included in the
 * files provided for this task, so this module cannot import their real
 * repository/service types directly without guessing at an unverified
 * shape. They are ported the same way (SubCategoryPort / SkuGroupPort /
 * SpecialStatusPort) — swap in the real providers in Product.module.ts
 * once those files are available to import from.
 *
 * COLUMN DISCREPANCY (flagged, not silently resolved): the Java entity
 * (Product.java), its contract (ProductContract.PRODUCT_SPECIFIC_SIZE_PROFILE
 * / _ENABLED), and its flat DTO (ProductData.java) all define
 * `productSpecificSizeProfile` (JSONB) and `productSpecificSizeProfileEnabled`
 * (boolean). Neither column exists on the introspected `product` pgTable in
 * database/schema/schema.ts. Both fields are kept on the API-facing types
 * below for parity with the Java DTOs, but the mapper/repository CANNOT
 * write them — no such column exists to write to. See Product.mapper.ts.
 *
 * No validation library (zod/class-validator) is installed in this project
 * (@anuprerna/types is an empty workspace stub, package.json lists
 * neither), so these stay plain TS types with hand-written runtime guards
 * in dto/Product.dto.ts, matching the Cart and Auth modules.
 */

/** com.bloomscorp.loom.product.product.orm.UNIT_ENUM — mirrors unitEnum in schema.ts exactly. */
export const UNITS = ["METER", "UNIT"] as const;
export type Unit = (typeof UNITS)[number];

/**
 * Product group values. Source (ProductContract.PRODUCT_GROUP) stores this
 * as a plain VARCHAR column, not a Postgres enum — no closed set is
 * enforced at the DB or entity level. "fabric" / "finished" / "swatch" are
 * the values referenced elsewhere in source (Cart module, nav-menu native
 * queries); kept as a loose string type rather than inventing a closed
 * enum the source doesn't have.
 */
export const KNOWN_PRODUCT_GROUPS = ["fabric", "finished", "swatch"] as const;
export type ProductGroup = (typeof KNOWN_PRODUCT_GROUPS)[number] | (string & {});

/**
 * Inbound shape for create/update Product requests. Field names mirror
 * Product.java's settable properties exactly, restricted to real columns
 * on the `product` table (see column-discrepancy note above for the two
 * exceptions kept for DTO parity only).
 *
 * `productSizeProfileList` / `imageGallerySEOList` are the two @OneToMany
 * child collections ProductDAOController#createProduct / #updateProduct
 * iterate over. Their row shapes belong to the ProductSizeProfile and
 * ProductPreview (image gallery SEO) migration steps — typed narrowly here
 * to exactly the fields Product Core's own control flow reads/writes
 * (sizeProfileOptionId, disabled) rather than guessing at their full shape.
 */
export interface ProductInput {
  id?: number; // required for update, absent for create
  subCategoryId: number;
  name: string;
  sku: string;
  skuGroupId: number;
  price: number;
  quantity?: number; // DB default 0.00 when absent
  externalQuantity?: number; // DB default 0.00 when absent
  unit: Unit;
  mainProductCheck: boolean;
  mainProductId?: number | null;
  tagId?: string; // comma-separated ids, DB default ""
  badgeProfileId?: number | null;
  badgeProfileEnabled?: boolean;
  volumeDiscountProfileId?: number | null;
  volumeDiscountProfileEnabled?: boolean;
  madeToOrderProfileId?: number | null;
  madeToOrderProfileEnabled?: boolean;
  madeToOrderFabricId?: number | null;
  sizeProfileId?: number | null;
  sizeProfileEnabled?: boolean;
  /** See column-discrepancy note — accepted for DTO parity, never persisted. */
  productSpecificSizeProfile?: unknown;
  /** See column-discrepancy note — accepted for DTO parity, never persisted. */
  productSpecificSizeProfileEnabled?: boolean;
  customSizeProfileId?: number | null;
  customSizeProfileEnabled?: boolean;
  finishProfileId?: number | null;
  finishProfileEnabled?: boolean;
  finishProfileItemId?: string | null;
  fabricProfileId?: number | null;
  fabricProfileEnabled?: boolean;
  specialStatusId?: number | null;
  productOverview: string;
  productCare: string;
  materialId: string;
  colorId: string;
  patternId?: string; // DB default ""
  sale?: boolean;
  discount?: number;
  heroImage?: string;
  hoverImage?: string;
  galleryImages?: string;
  productGroup: ProductGroup;
  productVideo: string;
  disabled?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  heroImageAlt?: string;
  hoverImageAlt?: string;
  productVideoAlt?: string;
  backwardCompatibleLink?: string;
  /** ProductDAOController#createProduct/#updateProduct child-collection input — see ProductSizeProfilePort. */
  productSizeProfileList?: ProductSizeProfileItemInput[];
  /** ProductDAOController#createProduct child-collection input — see ImageGallerySeoPort. */
  imageGallerySEOList?: ImageGallerySeoItemInput[];
}

/**
 * Narrow shape ProductDAOController#createProduct/#updateProduct read off
 * each ProductSizeProfile row it loops over (item.getSizeProfileOptionId(),
 * item.getId(), item.isDeleted() is NOT present on this entity — only
 * ProductImageGallerySEO rows carry a `deleted` flag; ProductSizeProfile
 * rows are wholesale-replaced on update instead, see class doc in
 * Product.service.ts). Full ProductSizeProfile persistence is the
 * ProductSizeProfile migration step — out of scope here.
 */
export interface ProductSizeProfileItemInput {
  id?: number;
  sizeProfileOptionId: number;
  quantity: number;
  disabled?: boolean;
  consumedFabric?: number | null;
}

/**
 * Narrow shape ProductDAOController#createProduct reads off each
 * ProductImageGallerySEO row (image, altText, and the `deleted` flag used
 * to filter the incoming list via `removeIf(ProductImageGallerySEO::isDeleted)`
 * before persisting the rest). Full persistence is the ProductPreview /
 * image-gallery-SEO migration step — out of scope here.
 */
export interface ImageGallerySeoItemInput {
  id?: number;
  image: string;
  altText: string;
  deleted?: boolean;
}

/**
 * com.bloomscorp.loom.product.pojo.ProductData — flat projection returned
 * by ProductDataNativeQuery.RETRIEVE_PRODUCT / RETRIEVE_PRODUCT_BY_ID.
 * Field order matches the native query's column order (significant for the
 * source @ConstructorResult mapping; preserved for parity, not required in
 * TS). See column-discrepancy note re: productSpecificSizeProfile(Enabled)
 * — kept for DTO parity; the native SQL queries in source select these
 * columns too (RETRIEVE_PRODUCT / RETRIEVE_PRODUCT_BY_ID both do), which
 * would fail against the introspected schema as-is. Flagged, not silently
 * dropped from the SQL text in Product.repository.ts either — see that
 * file's header comment.
 */
export interface ProductData {
  id: number;
  version: number;
  subCategoryId: number;
  name: string;
  slug: string;
  sku: string;
  skuGroupId: number;
  price: number;
  quantity: number;
  externalQuantity: number;
  unit: string;
  mainProductCheck: boolean;
  mainProductId: number | null;
  tagId: string;
  badgeProfileId: number | null;
  badgeProfileEnabled: boolean;
  volumeDiscountProfileId: number | null;
  volumeDiscountProfileEnabled: boolean;
  madeToOrderProfileId: number | null;
  madeToOrderProfileEnabled: boolean;
  madeToOrderFabricId: number | null;
  sizeProfileId: number | null;
  sizeProfileEnabled: boolean;
  customSizeProfileId: number | null;
  customSizeProfileEnabled: boolean;
  finishProfileId: number | null;
  finishProfileEnabled: boolean;
  finishProfileItemId: string | null;
  fabricProfileId: number | null;
  fabricProfileEnabled: boolean;
  specialStatusId: number | null;
  productOverview: string;
  productCare: string;
  materialId: string;
  colorId: string;
  patternId: string | null;
  sale: boolean;
  discount: number;
  heroImage: string;
  hoverImage: string;
  galleryImages: string;
  productGroup: string;
  productVideo: string;
  disabled: boolean;
  metaTitle: string;
  metaDescription: string;
  heroImageAlt: string;
  hoverImageAlt: string;
  productVideoAlt: string;
  backwardCompatibleLink: string;
}

/**
 * com.bloomscorp.loom.product.orm.Product as returned to callers of
 * retrieveProduct(id) — the full row plus the transient `totalQuantity`
 * (quantity + externalQuantity) ProductDAOController#retrieveProduct
 * computes before returning.
 */
export interface ProductView {
  id: number;
  version: number;
  subCategoryId: number;
  name: string;
  slug: string;
  sku: string;
  skuGroupId: number;
  price: number;
  quantity: number;
  externalQuantity: number;
  totalQuantity: number;
  unit: Unit;
  mainProductCheck: boolean;
  mainProductId: number | null;
  tagId: string;
  badgeProfileId: number | null;
  badgeProfileEnabled: boolean;
  volumeDiscountProfileId: number | null;
  volumeDiscountProfileEnabled: boolean;
  madeToOrderProfileId: number | null;
  madeToOrderProfileEnabled: boolean;
  madeToOrderFabricId: number | null;
  sizeProfileId: number | null;
  sizeProfileEnabled: boolean;
  customSizeProfileId: number | null;
  customSizeProfileEnabled: boolean;
  finishProfileId: number | null;
  finishProfileEnabled: boolean;
  finishProfileItemId: string | null;
  fabricProfileId: number | null;
  fabricProfileEnabled: boolean;
  specialStatusId: number | null;
  productOverview: string;
  productCare: string;
  materialId: string;
  colorId: string;
  patternId: string | null;
  sale: boolean;
  discount: number;
  heroImage: string;
  hoverImage: string;
  galleryImages: string;
  productGroup: string;
  productVideo: string;
  disabled: boolean;
  metaTitle: string;
  metaDescription: string;
  heroImageAlt: string;
  hoverImageAlt: string;
  productVideoAlt: string;
  backwardCompatibleLink: string;
}

/**
 * com.bloomscorp.loom.product.pojo.ProductGist — lightweight projection
 * used by findProductGists / findRelatedProducts. Field names match the
 * native query's column aliases exactly (source POJO uses snake_case
 * property names `hero_image` / `product_group` verbatim, not camelCase —
 * preserved as-is since this is the literal @AllArgsConstructor field set,
 * not a re-mapped API shape).
 */
export interface ProductGist {
  id: number;
  sku: string;
  name: string;
  hero_image: string;
  slug: string;
  product_group: string;
  price: number;
}

/** com.bloomscorp.loom.product.pojo.RelatedProducts — `record RelatedProducts(Long id, List<ProductGist> products)`. */
export interface RelatedProducts {
  id: number;
  products: ProductGist[];
}

/** Nav-menu result rows — com.bloomscorp.loom.navigation.pojo.* (NavMenuCraftResult etc.), reconstructed from the @SqlResultSetMapping column lists on Product.java. */
export interface NavMenuCraftResult {
  segmentCategoryId: number;
  segmentCategoryName: string;
  subCategoryId: number;
  subCategoryName: string;
}

export interface NavMenuMaterialResult {
  materialId: number;
  materialName: string;
}

export interface NavMenuPatternResult {
  patternId: number;
  patternName: string;
}

export interface NavMenuColorResult {
  colorId: number;
  colorLabel: string;
  colorHexCode: string;
}

export interface NavMenuFinishedResult {
  segmentCategoryId: number;
  segmentCategoryName: string;
  subCategoryId: number;
  subCategoryName: string;
  subCategoryFeaturedImage: string;
}

/**
 * Cross-module dependencies (SubCategory, SkuGroup, SpecialStatus — marked
 * complete but not importable here, see file header; plus Badge/Volume-
 * Discount/MadeToOrder/Size/CustomSize/Finish/Fabric profiles, which are
 * genuinely out of scope per MIGRATION_CHECKPOINT.md). Narrow ports typed
 * exactly to the calls ProductDAOController actually makes. Wire real
 * providers in Product.module.ts as each dependency module gets migrated.
 */
export interface SubCategoryPort {
  /** SubCategoryDAOController#retrieveSubCategoryWithRelatedEntities(id) */
  retrieveSubCategoryWithRelatedEntities(id: number): Promise<{ id: number } | null>;
}

export interface SkuGroupPort {
  /** SkuGroupDaoController#retrieveEntity(id) */
  retrieveEntity(id: number): Promise<{ id: number } | null>;
}

export interface SpecialStatusPort {
  /** SpecialStatusDaoController#retrieveEntity(id) */
  retrieveEntity(id: number): Promise<{ id: number } | null>;
}

export interface BadgeProfilePort {
  /** BadgeProfileDAOController#retrieveBadgeProfile(id) */
  retrieveBadgeProfile(id: number): Promise<{ id: number } | null>;
}

export interface VolumeDiscountProfilePort {
  /** VolumeDiscountProfileDAOController#retrieveVolumeDiscountProfile(id) */
  retrieveVolumeDiscountProfile(id: number): Promise<{ id: number } | null>;
}

export interface MadeToOrderProfilePort {
  /** MadeToOrderProfileDAOController#retrieveMadeToOrderProfile(id) */
  retrieveMadeToOrderProfile(id: number): Promise<{ id: number } | null>;
}

export interface MadeToOrderProductPreviewPort {
  /** MadeToOrderProductPreviewDaoController#retrieveMadeToOrderProfilePreview(id) */
  retrieveMadeToOrderProfilePreview(id: number): Promise<{ id: number } | null>;
}

export interface SizeProfilePort {
  /** SizeProfileDAOController#retrieveSizeProfile(id) */
  retrieveSizeProfile(id: number): Promise<{ id: number } | null>;
}

export interface CustomSizeProfilePort {
  /** CustomSizeProfileDAOController#retrieveCustomSizeProfile(id) */
  retrieveCustomSizeProfile(id: number): Promise<{ id: number } | null>;
}

export interface FinishProfilePort {
  /** FinishProfileDAOController#retrieveFinishProfile(id) */
  retrieveFinishProfile(id: number): Promise<{ id: number } | null>;
}

export interface FabricProfilePort {
  /** FabricProfileDAOController#retrieveFabricProfile(id) */
  retrieveFabricProfile(id: number): Promise<{ id: number } | null>;
}

export interface SizeProfileOptionPort {
  /** SizeProfileOptionDAOController#retrieveSizeProfileOption(id) — used to build `${sku}-${option.label}`. */
  retrieveSizeProfileOption(id: number): Promise<{ id: number; label: string } | null>;
}

/**
 * ProductSizeProfile persistence is its own migration step
 * (MIGRATION_CHECKPOINT.md). Product Core only needs to (a) delete the
 * existing rows for a product before an update-time replace, per
 * ProductSizeProfileDAOController#deleteProductSizeProfileItems, and
 * (b) sync each row's `disabled` flag onto the matching ProductZohoRelation
 * after a successful update (see ProductZohoRelationPort below).
 */
export interface ProductSizeProfilePort {
  deleteProductSizeProfileItems(productId: number): Promise<void>;
}

/**
 * ProductZohoRelation persistence is its own migration step. Product
 * Core's #updateProduct syncs `relation.disabled` to match each size's
 * `disabled` state post-update — ported as a narrow port call.
 */
export interface ProductZohoRelationPort {
  /** ProductZohoRelationJpaRepository#findProductZohoRelationByProductAndSku(product, sku) */
  findByProductAndSku(productId: number, sku: string): Promise<{ id: number } | null>;
  /** ProductZohoRelationDAOController#modifyEntity(relation) — sets disabled and saves. */
  setDisabled(relationId: number, disabled: boolean): Promise<void>;
}

/**
 * ProductPreview / image-gallery-SEO persistence is its own migration
 * step. Product Core's #createProduct filters out deleted rows and
 * persists the rest against the newly created product.
 */
export interface ImageGallerySeoPort {
  replaceForProduct(productId: number, items: ImageGallerySeoItemInput[]): Promise<void>;
}

export const SUB_CATEGORY_PORT = Symbol("SUB_CATEGORY_PORT");
export const SKU_GROUP_PORT = Symbol("SKU_GROUP_PORT");
export const SPECIAL_STATUS_PORT = Symbol("SPECIAL_STATUS_PORT");
export const BADGE_PROFILE_PORT = Symbol("BADGE_PROFILE_PORT");
export const VOLUME_DISCOUNT_PROFILE_PORT = Symbol("VOLUME_DISCOUNT_PROFILE_PORT");
export const MADE_TO_ORDER_PROFILE_PORT = Symbol("MADE_TO_ORDER_PROFILE_PORT");
export const MADE_TO_ORDER_PRODUCT_PREVIEW_PORT = Symbol("MADE_TO_ORDER_PRODUCT_PREVIEW_PORT");
export const SIZE_PROFILE_PORT = Symbol("SIZE_PROFILE_PORT");
export const CUSTOM_SIZE_PROFILE_PORT = Symbol("CUSTOM_SIZE_PROFILE_PORT");
export const FINISH_PROFILE_PORT = Symbol("FINISH_PROFILE_PORT");
export const FABRIC_PROFILE_PORT = Symbol("FABRIC_PROFILE_PORT");
export const SIZE_PROFILE_OPTION_PORT = Symbol("SIZE_PROFILE_OPTION_PORT");
export const PRODUCT_SIZE_PROFILE_PORT = Symbol("PRODUCT_SIZE_PROFILE_PORT");
export const PRODUCT_ZOHO_RELATION_PORT = Symbol("PRODUCT_ZOHO_RELATION_PORT");
export const IMAGE_GALLERY_SEO_PORT = Symbol("IMAGE_GALLERY_SEO_PORT");

/**
 * Ports the LogMessage/response strings ProductController would use, kept
 * empty pending RequestMapper.java / the controller layer per the brief
 * ("Do NOT generate controller files yet"). Placeholder left out entirely
 * rather than fabricated copy — unlike Cart, no ProductMessages source
 * text was found in the uploaded repository to port verbatim.
 */
// @ts-nocheck
// @ts-nocheck
