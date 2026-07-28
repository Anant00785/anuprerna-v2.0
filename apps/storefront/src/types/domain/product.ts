/**
 * Canonical Domain Product Interface
 * UI Components MUST ONLY import and consume this type.
 * Never directly consume backend DTOs inside components.
 */

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  currency: string;
  thumbnail: string;
  gallery: string[];
  inStock: boolean;
  availableQuantity?: number;
  material?: string;
  craft?: string;
  weave?: string;
  gsm?: number;
  ecoFriendly?: boolean;
  minimumOrderQty?: number;
  badge?: string;
  rating?: number;
  reviewsCount?: number;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ProductDetail extends Product {
  description: string;
  specifications: ProductSpecification[];
  careInstructions?: string;
  origin?: string;
  certification?: string;
  relatedProductSlugs?: string[];
}

export interface ProductFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  categorySlug?: string;
  crafts?: string[];
  materials?: string[];
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "popular" | "price_asc" | "price_desc" | "newest";
}

export interface ProductListResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
