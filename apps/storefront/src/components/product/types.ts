// Pure types for the product detail pages (Wave 3).
// No 'server-only' so client components can import types safely.

export interface BadgeItem {
  image: string;
  caption: string;
  link: string;
  id: number;
}

export interface VolumeDiscountItem {
  minimumOrderQuantity: number;
  discount: number;
  preOrder: boolean;
  advancePayment?: number;
  deliveryFromDays: number;
  deliveryToDays: number;
  id: number;
}

export interface MadeToOrderProfile {
  minimumOrderQuantity: number;
  deliveryFromDays: number;
  deliveryToDays: number;
  consumedFabric?: number;
}

// Made-to-order base fabric the finished product is built from (drives MTO stock).
// NOTE on stock: live loom-v2 pre-sums the fabric stock into totalQuantity, but the demo
// backend (127.0.0.1:8090) OMITS totalQuantity and exposes the raw ledger fields quantity
// (Zoho) + externalQuantity (adjustment ledger) -- total = quantity + externalQuantity.
// Read via mtoFabricTotalQuantity() (pricing.ts) so both shapes resolve to one number.
export interface MadeToOrderFabric {
  name: string;
  sku: string;
  slug: string;
  price: number;
  unit: string;
  quantity?: number;
  externalQuantity?: number;
  totalQuantity?: number;
  heroImage?: string;
  id: number;
}

// One measurement row inside a size option / size profile.
export interface SizeProfileGuideItem {
  guide: string;     // e.g. WAIST, CHEST/BUST, Width, Height
  value: number;     // inches
  sortOrder: number;
}

// A size option (S/M/L/XL) with its measurement rows.
export interface SizeProfileOptionItem {
  id: number;
  label: string;             // S / M / L / XL
  keyFeature?: string;       // e.g. "60 x 90" or "Chest/Bust circumference - 33"
  consumedFabric?: number;
  sortOrder: number;
  sizeProfileGuideList?: SizeProfileGuideItem[];
}

// Size guide profile (used by the Size Guide dialog).
export interface SizeProfile {
  profileName?: string;
  displayName?: string;
  disclaimer?: string;
  image?: string;
  sizeProfileOptionList: SizeProfileOptionItem[];
  sizeProfileGuideList?: SizeProfileGuideItem[];
}

// A single field in the custom-size measurement form (port of CustomSizeProfileItem).
// fieldType 1 => number input, else text. mandatory => red asterisk + required.
export interface CustomSizeProfileItem {
  label: string;
  fieldType: number;
  placeholder?: string;
  mandatory: boolean;
  id: number;
  version?: number;
}

// Custom-size measurement schema (port of CustomSizeProfile). Drives the
// measurement form shown when the shopper picks "Custom Size".
export interface CustomSizeProfile {
  profileName?: string;
  disclaimer?: string;
  price?: number;
  timeOfCreation?: number;
  customSizeProfileItemList: CustomSizeProfileItem[];
  id?: number;
  version?: number;
}

// A purchasable size variant on a finished product (qty + disabled per size).
export interface ProductSizeProfileItem {
  sizeProfileOption: SizeProfileOptionItem;
  sizeProfileOptionSku?: string;
  quantity: number;
  consumedFabric?: number;
  disabled: boolean;
  id: number;
}

// Customisation: choose-fabric options.
export interface FabricProfileItem {
  fabricPreview: {
    id?: number;
    name: string;
    slug?: string;
    sku?: string;
    price: number;
    totalQuantity?: number;
    heroImage?: string;
  };
}
export interface FabricProfile {
  profileName?: string;
  fabricProfileItemList: FabricProfileItem[];
}

// Customisation: choose-finish options.
export interface FinishProfileItem {
  id?: number;
  name?: string;
  label?: string;
  price?: number;
  image?: string;
  description?: string;
}
export interface FinishProfile {
  profileName?: string;
  /** live label for the finish/dye section (e.g. 'Finishes', 'Custom Natural Vegetable Dye'). */
  displayName?: string;
  finishProfileItemList: FinishProfileItem[];
}

export interface RelatedProductSwatch {
  id: number;
  name: string;
  slug: string;
  sku: string;
  heroImage: string;
  mainProductCheck: boolean;
  disabled: boolean;
}

export interface ImageSEO {
  image: string;
  altText: string;
  id: number;
}

export interface NamedRef { id: number; name: string; hex?: string }

export interface SubCategory {
  name: string;
  slug?: string;
  icon?: string;
  badgeProfile?: { badgeProfileItemList: BadgeItem[] };
  volumeDiscountProfile?: {
    profileName?: string;
    disclaimer?: string;
    volumeDiscountProfileItemList: VolumeDiscountItem[];
    /** ── THE REDACTED FORM (see the wrapper's products/trade-pricing.ts) ──
     *  When the caller is not entitled to trade pricing the wrapper sends the
     *  ladder as an EMPTY list and keeps only these MOQ facts, so the page can
     *  still state the minimum plainly (and the pre-order lead time) without
     *  ever receiving a tier price. `tradePricingRedacted` is what lets the UI
     *  tell "this product has no tiers" from "you are not entitled to see
     *  them" — without it an empty ladder would render as a 0% discount. */
    minimumOrderQuantity?: number | null;
    preOrderMinimumOrderQuantity?: number | null;
    preOrderDeliveryFromDays?: number | null;
    preOrderDeliveryToDays?: number | null;
    tradePricingRedacted?: boolean;
    /** EXISTENCE, not value. Sent ONLY in the redacted form. `hasTradePricing`
     *  means this product really does have a volume-tier ladder; `hasBulkPreOrder`
     *  means at least one of those tiers is a pre-order tier. They are what lets
     *  the page keep the bulk entry point VISIBLE for a guest and a retail
     *  account without ever receiving a tier price, a discount percent or a
     *  count. Never infer 'there is bulk pricing' from anything else here. */
    hasTradePricing?: boolean;
    hasBulkPreOrder?: boolean;
  };
  madeToOrderProfile?: MadeToOrderProfile;
}

export interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: number;
  unit: string;
  totalQuantity: number;
  quantity: number;
  /** Adjustment-ledger stock (external_quantity). Summed with quantity as the
   *  effective parent stock when the backend leaves totalQuantity=0 (see stock.ts). */
  externalQuantity?: number;
  productGroup: string;
  heroImage: string;
  hoverImage: string;
  heroImageAlt?: string;
  hoverImageAlt?: string;
  galleryImages: string; // comma-separated
  imageGallerySEOList: ImageSEO[];
  productOverview: string;   // HTML
  productCare: string;       // HTML
  materials: NamedRef[];
  colors: NamedRef[];
  patterns: NamedRef[];
  sale: boolean;
  discount: number;
  metaTitle?: string;
  metaDescription?: string;
  relatedProductList: RelatedProductSwatch[];
  badgeProfile?: { badgeProfileItemList: BadgeItem[] };
  badgeProfileEnabled: boolean;
  volumeDiscountProfile?: {
    profileName?: string;
    disclaimer?: string;
    volumeDiscountProfileItemList: VolumeDiscountItem[];
    /** ── THE REDACTED FORM (see the wrapper's products/trade-pricing.ts) ──
     *  When the caller is not entitled to trade pricing the wrapper sends the
     *  ladder as an EMPTY list and keeps only these MOQ facts, so the page can
     *  still state the minimum plainly (and the pre-order lead time) without
     *  ever receiving a tier price. `tradePricingRedacted` is what lets the UI
     *  tell "this product has no tiers" from "you are not entitled to see
     *  them" — without it an empty ladder would render as a 0% discount. */
    minimumOrderQuantity?: number | null;
    preOrderMinimumOrderQuantity?: number | null;
    preOrderDeliveryFromDays?: number | null;
    preOrderDeliveryToDays?: number | null;
    tradePricingRedacted?: boolean;
    /** EXISTENCE, not value. Sent ONLY in the redacted form. `hasTradePricing`
     *  means this product really does have a volume-tier ladder; `hasBulkPreOrder`
     *  means at least one of those tiers is a pre-order tier. They are what lets
     *  the page keep the bulk entry point VISIBLE for a guest and a retail
     *  account without ever receiving a tier price, a discount percent or a
     *  count. Never infer 'there is bulk pricing' from anything else here. */
    hasTradePricing?: boolean;
    hasBulkPreOrder?: boolean;
  };
  volumeDiscountProfileEnabled: boolean;
  madeToOrderProfile?: MadeToOrderProfile;
  madeToOrderProfileEnabled: boolean;
  // --- finished-product variant fields ---
  madeToOrderFabric?: MadeToOrderFabric;
  sizeProfile?: SizeProfile;
  sizeProfileEnabled?: boolean;
  productSpecificSizeProfile?: SizeProfile;
  productSpecificSizeProfileEnabled?: boolean;
  productSizeProfileList?: ProductSizeProfileItem[];
  customSizeProfileEnabled?: boolean;
  customSizeProfile?: CustomSizeProfile;
  fabricProfile?: FabricProfile;
  fabricProfileEnabled?: boolean;
  finishProfile?: FinishProfile;
  finishProfileEnabled?: boolean;
  specialStatus?: { name: string };
  category?: { name: string };
  segment?: { name: string };
  subCategory?: SubCategory;
  productVideo?: string;
  productVideoPoster?: string;
  maxVolumeDiscount?: number | null;
  addToSwatch?: boolean;
}

export interface FabricProductResponse {
  success: boolean;
  /** Present + "unavailable" when the product exists but is disabled (soft-deny
   *  -- see backend products.controller.ts getFabricBySlug/V2). Absent for a
   *  genuine never-existed slug -- both cases still resolve success:false. */
  reason?: string;
  fabricProduct?: {
    product: ProductDetail;
    gsm?: number;
    // Backend width is a free-form string (e.g. "45 inch", '45" (115 cms)',
    // or a bare "45") -- never a bare number in practice; typed loosely to
    // match. See ProductInfoPanel's formatWidthValue for rendering.
    width?: number | string;
    addToSwatch?: boolean;
    id: number;
    version: number;
  };
}

export interface FinishedProductResponse {
  success: boolean;
  /** Present + "unavailable" when the product exists but is disabled (soft-deny
   *  -- see backend products.controller.ts getFinishedBySlug). Absent for a
   *  genuine never-existed slug -- both cases still resolve success:false. */
  reason?: string;
  finishedProduct?: {
    product: ProductDetail;
    id: number;
    version: number;
  };
}

export interface ReviewStats {
  count: number;
  rating: number;
}

// A single product review (port of IReview / /get/product/review/{id}).
export interface ProductReview {
  id?: number;
  name: string;
  city?: string;
  country?: string;
  rating: number;
  description?: string;
  link?: string;
  productImages?: string;
  createdAt?: number;
}

export interface ReviewItem {
  id: number;
  rating: number;
  comment?: string;
  customerName?: string;
  timeOfCreation?: number;
}


// A single PDP gallery item — image OR an embedded YouTube short.
// Mirrors light-gallery-item.ts (type: 'image' | 'youtube').
export interface GalleryMediaItem {
  src: string;          // image URL, or YouTube embed URL for video
  thumb: string;        // thumbnail URL (poster for video)
  alt: string;
  type: 'image' | 'youtube';
}

// Wholesale loyalty membership info (loom /get/customer/loyalty/info).
export interface WholesaleMembershipInfo {
  active: boolean;
  percentileDiscount: number;
}

// Normalised product + extra fields handed to client components
export interface NormalisedProduct {
  product: ProductDetail;
  /** Parsed gallery image list (heroImage always first) */
  images: { src: string; alt: string }[];
  /** Fabric-specific */
  gsm?: number;
  /** Free-form backend string in practice (e.g. "45 inch") -- see types above. */
  width?: number | string;
  addToSwatch?: boolean;
  /** fabricProduct or finishedProduct id (used for cart add) */
  recordId: number;
  /** Full media gallery (hero, video, hover, SEO images) in source order. */
  media: GalleryMediaItem[];
  /** SWATCH_PRICE_PERCENTAGE setting (e.g. 3 ⇒ swatch = 3% of price). */
  swatchPercentage: number;
}
