import { env } from "@/env";
import { Product, ProductDetail, ProductFilterParams, ProductListResult } from "@/types/domain/product";
import { HeaderNavigation } from "@/types/domain/navigation";
import { apiRequest } from "../client";
import {
  mapLegacyNavigationToDomain,
  mapLegacyProductDetailToDomain,
  mapLegacyProductToDomain,
} from "../adapters/legacy-catalog.adapter";
import {
  mapNestNavigationToDomain,
  mapNestProductDetailToDomain,
  mapNestProductToDomain,
} from "../adapters/nest-catalog.adapter";
import { LegacyFabricProductDto, LegacySpringResponse } from "../dto/legacy-springboot.dto";
import { NestApiResponse, NestNavigationDto, NestProductDto } from "../dto/nestjs.dto";

export const catalogRepository = {
  /**
   * Fetch site navigation menu hierarchy
   */
  async getNavigation(): Promise<HeaderNavigation> {
    const mode = env.NEXT_PUBLIC_API_MODE;

    if (mode === "legacy") {
      try {
        const response = await apiRequest<LegacySpringResponse<any>>("/get/navigation", {}, "legacy");
        const raw = response?.payload || response?.content || response;
        return mapLegacyNavigationToDomain(raw);
      } catch (err) {
        console.warn("Failed to fetch legacy navigation, using fallback navigation model:", err);
        return mapLegacyNavigationToDomain([]);
      }
    } else {
      const response = await apiRequest<NestApiResponse<NestNavigationDto[]>>("/v1/navigation", {}, "nest");
      return mapNestNavigationToDomain(response.data);
    }
  },

  /**
   * Fetch catalog fabric product list with filters & pagination
   */
  async getFabricProducts(params: ProductFilterParams = {}): Promise<ProductListResult> {
    const mode = env.NEXT_PUBLIC_API_MODE;
    const page = params.page ?? 1;
    const limit = params.limit ?? 12;

    if (mode === "legacy") {
      try {
        const payloadBody = {
          pageNo: Math.max(0, page - 1),
          pageSize: limit,
          categorySlug: params.categorySlug,
          crafts: params.crafts,
          materials: params.materials,
          search: params.search,
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
          sortBy: params.sortBy,
        };

        const response = await apiRequest<LegacySpringResponse<any>>(
          "/get/fabric-preview-list",
          {
            method: "POST",
            body: JSON.stringify(payloadBody),
          },
          "legacy"
        );

        const content: LegacyFabricProductDto[] =
          response.payload?.content ||
          response.content ||
          (Array.isArray(response.payload) ? response.payload : []) ||
          [];

        const total =
          response.payload?.totalElements ||
          response.totalElements ||
          content.length;

        const totalPages = Math.ceil(total / limit) || 1;

        return {
          products: content.map(mapLegacyProductToDomain),
          total,
          page,
          limit,
          totalPages,
        };
      } catch (err) {
        console.warn("Failed to fetch legacy products, returning empty result:", err);
        return {
          products: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }
    } else {
      const response = await apiRequest<NestApiResponse<NestProductDto[]>>(
        "/v1/products",
        {
          params: {
            page,
            limit,
            search: params.search,
            category: params.categorySlug,
            sortBy: params.sortBy,
          },
        },
        "nest"
      );

      const products = (response.data || []).map(mapNestProductToDomain);
      const total = response.meta?.total || products.length;

      return {
        products,
        total,
        page,
        limit,
        totalPages: response.meta?.totalPages || Math.ceil(total / limit) || 1,
      };
    }
  },

  /**
   * Fetch single product detail by slug
   */
  async getProductBySlug(slug: string): Promise<ProductDetail | null> {
    const mode = env.NEXT_PUBLIC_API_MODE;

    if (mode === "legacy") {
      try {
        const response = await apiRequest<LegacySpringResponse<LegacyFabricProductDto>>(
          `/get/fabric-product/slug/${encodeURIComponent(slug)}`,
          {},
          "legacy"
        );

        const dto = response.payload || response.content || response.data;
        if (!dto) return null;

        return mapLegacyProductDetailToDomain(dto);
      } catch (err) {
        console.warn(`Failed to fetch legacy product slug [${slug}]:`, err);
        return null;
      }
    } else {
      try {
        const response = await apiRequest<NestApiResponse<NestProductDto>>(
          `/v1/products/slug/${encodeURIComponent(slug)}`,
          {},
          "nest"
        );

        return mapNestProductDetailToDomain(response.data);
      } catch (err) {
        console.warn(`Failed to fetch nest product slug [${slug}]:`, err);
        return null;
      }
    }
  },

  /**
   * Perform AI / Keyword Search across fabric catalog
   */
  async searchAI(query: string): Promise<Product[]> {
    const mode = env.NEXT_PUBLIC_API_MODE;

    if (mode === "legacy") {
      try {
        const response = await apiRequest<LegacySpringResponse<any>>(
          "/search/ai/",
          {
            method: "POST",
            body: JSON.stringify({ query }),
          },
          "legacy"
        );

        const rawList = response.payload?.content || response.payload || response.content || [];
        const items = Array.isArray(rawList) ? rawList : [];
        return items.map(mapLegacyProductToDomain);
      } catch (err) {
        console.warn("Legacy AI search failed:", err);
        return [];
      }
    } else {
      const response = await apiRequest<NestApiResponse<NestProductDto[]>>(
        "/v1/search",
        { params: { q: query } },
        "nest"
      );
      return (response.data || []).map(mapNestProductToDomain);
    }
  },

  /**
   * Fetch craft manufacturing process list
   */
  async getCrafts(): Promise<any[]> {
    try {
      const response = await apiRequest<LegacySpringResponse<any>>(
        "/get/navigation/fabric/craft",
        {},
        "legacy"
      );
      return response?.payload || response?.content || response || [];
    } catch (err) {
      console.warn("Failed to fetch crafts list from legacy API:", err);
      return [];
    }
  },

  /**
   * Fetch stories by category name (Crafts, Collaborations, Clusters)
   */
  async getStoriesByCategory(category: "Crafts" | "Collaborations" | "Clusters" | string): Promise<any[]> {
    try {
      const response = await apiRequest<LegacySpringResponse<any>>(
        `/get/stories/category/${encodeURIComponent(category)}`,
        {},
        "legacy"
      );
      return response?.payload || response?.content || (Array.isArray(response) ? response : []);
    } catch (err) {
      console.warn(`Failed to fetch stories for category [${category}]:`, err);
      return [];
    }
  },

  /**
   * Fetch customer blogs content list
   */
  async getBlogs(): Promise<any[]> {
    try {
      const response = await apiRequest<LegacySpringResponse<any>>(
        "/get/blog-content-list/customer",
        {},
        "legacy"
      );
      return response?.payload || response?.content || (Array.isArray(response) ? response : []);
    } catch (err) {
      console.warn("Failed to fetch customer blogs list:", err);
      return [];
    }
  },

  /**
   * Fetch customer reviews list
   */
  async getReviews(): Promise<any[]> {
    try {
      const response = await apiRequest<LegacySpringResponse<any>>(
        "/get/review",
        {},
        "legacy"
      );
      return response?.payload || response?.content || (Array.isArray(response) ? response : []);
    } catch (err) {
      console.warn("Failed to fetch customer reviews list:", err);
      return [];
    }
  },
};
