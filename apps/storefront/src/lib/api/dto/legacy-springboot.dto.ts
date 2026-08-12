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

export interface LegacyCartItemDto {
  cartItemId?: string | number;
  productId?: string | number;
  productDetails?: LegacyFabricProductDto;
  qty?: number;
  unitPrice?: number;
  totalPrice?: number;
  selectedColorHex?: string;
  variantId?: string;
}

export interface LegacyCartResponseDto {
  cartId?: string;
  items?: LegacyCartItemDto[];
  totalCartValue?: number;
  discountAmount?: number;
  deliveryCharge?: number;
}

export interface LegacySpringResponse<T> {
  status?: number;
  message?: string;
  payload?: T;
  content?: T;
  data?: T;
  totalElements?: number;
}
