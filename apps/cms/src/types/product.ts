/**
 * Weave CMS — Product domain types.
 *
 * Mirrors the Loom product shape as served by our :8090 wrapper
 * (backend/src/product.service.ts buildProductObject) and the legacy
 * Angular Weave interfaces (manage-product/base-product-components).
 *
 * Two product families share one ProductItem core:
 *   - FabricProduct   → envelope { id, version, product, gsm, addToSwatch, width }
 *   - FinishedProduct → envelope { id, version, product }
 */

export type ProductType = "fabric" | "finished";

// ── Reference option used by selects / multi-selects ────────────────────────
export interface RefOption {
  id: number;
  name: string;
}

// ── Sub-category nested profile (only the fields the form consumes) ──────────
export interface FinishProfileItem {
  id: number;
  label: string;
  price?: number;
}

export interface SizeProfileOption {
  id: number;
  label: string;
  keyFeature?: string;
  consumedFabric?: number | null;
}

export interface SubCategoryProfile {
  id: number;
  profileName?: string;
  displayName?: string;
  finishProfileItemList?: FinishProfileItem[];
  sizeProfileOptionList?: SizeProfileOption[];
}

// ── Sub-category carries the profiles available to a product ────────────────
export interface SubCategory extends RefOption {
  badgeProfile?: SubCategoryProfile;
  volumeDiscountProfile?: SubCategoryProfile;
  fabricProfile?: SubCategoryProfile;
  customSizeProfile?: SubCategoryProfile;
  finishProfile?: SubCategoryProfile;
  madeToOrderProfile?: SubCategoryProfile;
  sizeProfile?: SubCategoryProfile;
}

// ── Per-variant Zoho mapping row ────────────────────────────────────────────
export interface ZohoRelation {
  id?: number;
  hsnCode: string;
  purchasePrice: number;
  sku: string;
  quantity: number;
  zohoItemId: string;
  tax: number;
  disabled: boolean;
}

// ── Size-wise stock row (size profile) ──────────────────────────────────────
export interface ProductSizeProfile {
  id?: number;
  sizeProfileOption?: SizeProfileOption;
  sizeProfileOptionId: number;
  sizeProfileOptionSku?: string;
  quantity: number;
  label?: string;
  disabled: boolean;
  consumedFabric?: number | null;
}

// ── SEO gallery image ───────────────────────────────────────────────────────
export interface SeoGalleryImage {
  id?: number;
  image: string;
  altText?: string;
}

/**
 * The product object as READ from the wrapper (nested taxonomy objects,
 * csv id strings for filters, json profile blobs). All fields optional —
 * the wrapper strips nulls (Jackson NON_NULL parity).
 */
export interface LoadedProduct {
  id?: number;
  category?: RefOption;
  segment?: RefOption;
  subCategory?: SubCategory;
  skuGroup?: RefOption;
  specialStatus?: RefOption;

  name?: string;
  slug?: string;
  sku?: string;
  price?: number;
  quantity?: number;
  externalQuantity?: number;
  totalQuantity?: number;
  unit?: string;

  mainProductCheck?: boolean;
  mainProductId?: number;

  // filters — csv id strings + resolved object arrays
  materialId?: string;
  colorId?: string;
  patternId?: string;
  tagId?: string;
  materials?: RefOption[];
  colors?: RefOption[];
  patterns?: RefOption[];
  tags?: RefOption[];

  // profiles — enabled flags + json blobs
  badgeProfile?: SubCategoryProfile;
  badgeProfileEnabled?: boolean;
  volumeDiscountProfile?: SubCategoryProfile;
  volumeDiscountProfileEnabled?: boolean;
  fabricProfile?: SubCategoryProfile;
  fabricProfileEnabled?: boolean;
  customSizeProfile?: SubCategoryProfile;
  customSizeProfileEnabled?: boolean;
  finishProfile?: SubCategoryProfile;
  finishProfileEnabled?: boolean;
  finishProfileItemId?: string;
  madeToOrderProfile?: SubCategoryProfile;
  madeToOrderProfileEnabled?: boolean;
  madeToOrderFabric?: RefOption & { product_id?: number };
  sizeProfile?: SubCategoryProfile;
  sizeProfileEnabled?: boolean;
  productSpecificSizeProfile?: { sizeProfileOptionList?: SizeProfileOption[] };
  productSpecificSizeProfileEnabled?: boolean;
  productSizeProfileList?: ProductSizeProfile[];

  productOverview?: string;
  productCare?: string;
  sale?: boolean;
  discount?: number;

  heroImage?: string;
  hoverImage?: string;
  galleryImages?: string;
  heroImageAlt?: string;
  hoverImageAlt?: string;
  imageGallerySEOList?: SeoGalleryImage[];

  metaTitle?: string;
  metaDescription?: string;
  productVideo?: string;
  productVideoPoster?: string;
  productVideoAlt?: string;

  backwardCompatibleLink?: string;
  productGroup?: string;
  productZohoRelationList?: ZohoRelation[];
  disabled?: boolean;
  version?: number;
}

// ── Discriminated envelope returned by the wrapper by-id routes ─────────────
export interface FabricEnvelope {
  type: "fabric";
  id: number;
  version: number;
  gsm?: number;
  addToSwatch?: boolean;
  width?: string;
  product: LoadedProduct;
}

export interface FinishedEnvelope {
  type: "finished";
  id: number;
  version: number;
  product: LoadedProduct;
}

export type ProductEnvelope = FabricEnvelope | FinishedEnvelope;

// ── Reference data bundle loaded for the form's dropdowns ───────────────────
export interface ReferenceData {
  categories: RefOption[];
  segments: RefOption[];
  subCategories: RefOption[];
  skuGroups: RefOption[];
  materials: RefOption[];
  colors: RefOption[];
  patterns: RefOption[];
  tags: RefOption[];
  specialStatuses: RefOption[];
  products: { id: number; sku: string; product_id?: number }[];
  /** true when the wrapper returned live reference lists (i.e. authenticated) */
  authenticated: boolean;
}

// ── Write-payload envelopes (what the legacy transmission service POSTs) ─────
// product carries IDs only; nested taxonomy/filter objects are dropped.
export interface WriteProductItem {
  id: number;
  categoryId: number;
  segmentId: number;
  subCategoryId: number;
  skuGroupId: number;
  specialStatusId: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  unit: string;
  metaTitle: string;
  metaDescription: string;
  mainProductCheck: boolean;
  mainProductId: number;
  materialId: string;
  colorId: string;
  patternId: string;
  tagId: string;
  badgeProfileId: number;
  badgeProfileEnabled: boolean;
  volumeDiscountProfileId: number;
  volumeDiscountProfileEnabled: boolean;
  fabricProfileId: number;
  fabricProfileEnabled: boolean;
  customSizeProfileId: number;
  customSizeProfileEnabled: boolean;
  finishProfileId: number;
  finishProfileEnabled: boolean;
  finishProfileItemId: string;
  madeToOrderProfileId: number;
  madeToOrderProfileEnabled: boolean;
  madeToOrderFabricId: number;
  sizeProfileId: number;
  sizeProfileEnabled: boolean;
  productSpecificSizeProfileEnabled: boolean;
  productOverview: string;
  productCare: string;
  sale: boolean;
  discount: number;
  heroImage: string;
  hoverImage: string;
  galleryImages: string;
  heroImageAlt: string;
  hoverImageAlt: string;
  productVideo: string;
  productVideoAlt: string;
  backwardCompatibleLink: string;
  productGroup: string;
  productSizeProfileList: ProductSizeProfile[];
  productZohoRelationList: ZohoRelation[];
  imageGallerySEOList: SeoGalleryImage[];
  disabled: boolean;
}

export interface FabricWritePayload {
  id: number;
  product: WriteProductItem;
  gsm: number;
  addToSwatch: boolean;
  width: string;
}

export interface FinishedWritePayload {
  id: number;
  product: WriteProductItem;
}

export type WritePayload = FabricWritePayload | FinishedWritePayload;
