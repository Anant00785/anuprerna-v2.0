/**
 * Catalog reference-data types — Milestone 1 of the Weave CMS rebuild.
 * Mirrors the Loom entity shapes returned by category-list, segment-list,
 * sub-category-list, sku-group-list, etc. endpoints via the :8090 wrapper.
 */

export interface CatalogCategory {
  id: number;
  name: string;
  icon?: string;
  socialImage?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface CatalogSegment {
  id: number;
  name: string;
  categoryId?: number;
  category?: { id: number; name: string } | null;
  icon?: string;
  socialImage?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface CatalogSubCategory {
  id: number;
  name: string;
  categoryId?: number;
  segmentId?: number;
  category?: { id: number; name: string } | null;
  segment?: { id: number; name: string } | null;
  icon?: string;
  socialImage?: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  badgeProfileId?: number;
  finishProfileId?: number;
  customSizeProfileId?: number;
  madeToOrderProfileId?: number;
  sizeProfileId?: number;
  volumeDiscountProfileId?: number;
  fabricProfileId?: number;
}

export interface CatalogSimpleItem {
  id: number;
  name: string;
  /** Present only on Colors (config-tail addColor/updateColor requires it). */
  hex?: string;
}
