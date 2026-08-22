import {
  PLPProduct,
  PLPMetadataInfo,
  FilterRelatedProduct,
  FilterSegment,
  FilterSEO,
} from "@/types/domain/plp";

export interface PLPDataResponse {
  products: PLPProduct[];
  colors: PLPMetadataInfo[];
  materials: PLPMetadataInfo[];
  patterns: PLPMetadataInfo[];
}

export const plpRepository = {
  /**
   * Fetch PLP data (products + metadata) via Next.js proxy route to bypass browser CORS
   */
  async getPLPData(group: "fabric" | "finished", category: string = ""): Promise<PLPDataResponse> {
    try {
      const isServer = typeof window === "undefined";
      const origin = isServer ? "http://localhost:4200" : "";
      const url = `${origin}/api/plp?group=${group}&category=${encodeURIComponent(category)}`;

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`PLP API Route HTTP ${res.status}`);
      const json = await res.json();
      return {
        products: json.products || [],
        colors: json.colors || [],
        materials: json.materials || [],
        patterns: json.patterns || [],
      };
    } catch (err) {
      console.warn("Failed to fetch PLP data:", err);
      return { products: [], colors: [], materials: [], patterns: [] };
    }
  },

  /**
   * Fetch related products for product cards swatches
   */
  async getRelatedProducts(productIdsCsv: string): Promise<FilterRelatedProduct[]> {
    if (!productIdsCsv) return [];
    try {
      const isServer = typeof window === "undefined";
      const origin = isServer ? "http://localhost:4200" : "";
      const url = `${origin}/api/plp/related?ids=${encodeURIComponent(productIdsCsv)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return [];
      const json = await res.json();
      return json.relatedProductsList || [];
    } catch (err) {
      console.warn("Failed to fetch related products:", err);
      return [];
    }
  },

  /**
   * Fetch category segment list
   */
  async getFilterSegments(category: string): Promise<FilterSegment[]> {
    if (!category) return [];
    try {
      const isServer = typeof window === "undefined";
      const origin = isServer ? "http://localhost:4200" : "";
      const url = `${origin}/api/plp/segments?category=${encodeURIComponent(category)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return [];
      const json = await res.json();
      return json.segmentList || [];
    } catch (err) {
      console.warn("Failed to fetch filter segments:", err);
      return [];
    }
  },
};
