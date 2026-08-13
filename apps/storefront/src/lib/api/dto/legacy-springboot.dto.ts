/**
 * Legacy Java Spring Boot API DTO Specifications
 * Matches responses from https://loom-v2.anuprerna.com
 */

export interface LegacyPriceDetailsDto {
  basePrice?: number;
  discountedPrice?: number;
  currencySymbol?: string;
  mrp?: number;
}

export interface LegacyFabricProductDto {
  id?: number | string;
  productId?: number | string;
  slug?: string;
  productName?: string;
  title?: string;
  description?: string;
  basePrice?: number;
  priceDetails?: LegacyPriceDetailsDto;
  currencySymbol?: string;
  primaryImage?: string;
  images?: string[];
  availableQuantity?: number;
  materialName?: string;
  craftName?: string;
  weaveName?: string;
  gsm?: number;
  isEcoFriendly?: boolean;
  minOrderQuantity?: number;
  ratingAverage?: number;
  totalReviews?: number;
  specifications?: Record<string, string>;
  careInstructions?: string;
  countryOfOrigin?: string;
  certificationStatus?: string;
}

export interface LegacyFabricPagePayload {
  content?: LegacyFabricProductDto[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}

export interface LegacyNavigationItemDto {
  id?: string | number;
  title?: string;
  name?: string;
  url?: string;
  iconName?: string;
  badgeText?: string;
  subMenus?: LegacyNavigationItemDto[];
  children?: LegacyNavigationItemDto[];
  thumbnailImage?: string;
  description?: string;
}

export interface LegacyNavigationResponseDto {
  navigationList?: LegacyNavigationItemDto[];
  categories?: LegacyNavigationItemDto[];
  promoBannerText?: string;
  promoBannerLink?: string;
}

/**
 * Loom's cart DTOs, as observed on `GET /get/cart-item/list` against live Loom.
 * The response envelope is `{"cartItemList": [...], "success": true}` — there is
 * no `payload`/`content`/`data` key and no cart-level totals object: Loom returns
 * the `CartItem` JPA rows and nothing else, so every total is client-derived.
 */
export interface LegacyCartProductDto {
  id?: number;
  name?: string;
  slug?: string;
  sku?: string;
  price?: number;
  unit?: string;
  quantity?: number;
  totalQuantity?: number;
  heroImage?: string;
}

/** A `FabricPreview` / `FinishedPreview` row. Its `id` is what `/add/cart-item` takes. */
export interface LegacyCartPreviewDto {
  id?: number;
  gsm?: number;
  product?: LegacyCartProductDto;
}

export interface LegacyCartItemDto {
  id?: number;
  quantity?: number;
  unit?: string;
  orderType?: string;
  productGroup?: string;
  /** Loom persists no unit price on the cart row; this is the only price-ish field. */
  makingCharge?: number;
  selectedFinishId?: string;
  fabricProductPreview?: LegacyCartPreviewDto | null;
  finishedProductPreview?: LegacyCartPreviewDto | null;
}

export interface LegacyCartListResponse {
  cartItemList?: LegacyCartItemDto[];
  success?: boolean;
  message?: string;
}

export interface LegacySpringResponse<T> {
  status?: number;
  message?: string;
  payload?: T;
  content?: T;
  data?: T;
  totalElements?: number;
}
