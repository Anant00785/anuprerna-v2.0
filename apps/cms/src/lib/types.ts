export type ProductType = "fabric" | "finished";
export type ListingStatus = "ACTIVE" | "DRAFT" | "INACTIVE";

export interface ProductPreview {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  status: ListingStatus;
  productType: ProductType;
  category?: string;
  subCategory?: string;
  updatedAt?: string;
}

/**
 * Normalized listing row — derived from the raw backend preview-list response.
 * Both fabric and finished preview items are normalized into this shape.
 */
export interface ListingRow {
  /** Top-level preview record id — used for URL routing (/listings/[id]) */
  id: number;
  /** product.id — used for backend API calls (/get/fabric-product/[productId]) */
  productId: number;
  name: string;
  sku: string;
  price: number;
  /** Current available quantity */
  quantity: number;
  /** Total quantity including reserved/external */
  totalQuantity: number;
  /** S3 hero image URL */
  heroImage: string;
  category: string;
  subCategory: string;
  status: ListingStatus;
  productType: ProductType;
  /** true when the product is disabled — admin Listings badges these (default view is enabled-only) */
  disabled?: boolean;
}

export interface PreviewListResponse {
  success: boolean;
  message: string;
  productPreviewList: unknown[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string | number;
  email: string;
  name: string;
  role: "superuser" | "admin" | "user" | "guest";
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}
