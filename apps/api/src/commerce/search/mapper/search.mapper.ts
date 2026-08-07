import { ProductSearchResult } from "../types/search.types.js";

// Currently mapping is handled directly in search.repository.ts for optimal query performance.
// This file is a placeholder for future complex transformations if needed.
export function mapProductToSearchResult(raw: any): ProductSearchResult {
  return {
    id: raw.id,
    sku: String(raw.sku),
    name: String(raw.name),
    heroImage: String(raw.heroImage || ""),
    hoverImage: String(raw.hoverImage || ""),
    heroImageAltText: String(raw.heroImageAlt || ""),
    hoverImageAltText: String(raw.hoverImageAlt || ""),
    slug: String(raw.slug),
    productGroup: String(raw.productGroup),
    price: Number(raw.price),
    specialStatus: raw.specialStatus ? String(raw.specialStatus) : null,
    unit: String(raw.unit),
  };
}
