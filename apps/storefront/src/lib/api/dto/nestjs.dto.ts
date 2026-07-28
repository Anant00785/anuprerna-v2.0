/**
 * NestJS API DTO Specifications
 * Matches modern REST standard responses from NestJS API (api.v2.anuprerna.com)
 */

export interface NestPriceDto {
  amount: number;
  currency: string;
  originalAmount?: number;
}

export interface NestProductDto {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  description?: string;
  price: NestPriceDto;
  thumbnailUrl: string;
  galleryUrls: string[];
  stockQuantity: number;
  isAvailable: boolean;
  material?: string;
  craft?: string;
  weave?: string;
  weightGsm?: number;
  isSustainable?: boolean;
  minOrderQty?: number;
  specs?: Record<string, string>;
  careInstructions?: string;
  originCountry?: string;
  certifications?: string[];
  relatedProductSlugs?: string[];
}

export interface NestNavigationDto {
  id: string;
  label: string;
  path: string;
  icon?: string;
  badge?: string;
  children?: NestNavigationDto[];
  imageUrl?: string;
  description?: string;
}

export interface NestCartItemDto {
  id: string;
  productId: string;
  product: NestProductDto;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  variantId?: string;
}

export interface NestCartDto {
  id: string;
  items: NestCartItemDto[];
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  grandTotal: number;
  currency: string;
}

export interface NestMetaDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NestApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: NestMetaDto;
}
