import { Injectable } from "@nestjs/common";
import { SearchRepository } from "../repository/search.repository.js";
import { ProductSearchResult, LoomSearchResult } from "../types/search.types.js";

@Injectable()
export class SearchService {
  constructor(private readonly searchRepository: SearchRepository) {}

  async searchProduct(keyword: string): Promise<ProductSearchResult[]> {
    const terms = [...new Set(keyword.split(",").map(t => t.trim()).filter(t => t.length > 0))];
    const results: ProductSearchResult[] = [];
    
    await Promise.all(
      terms.map(async (term) => {
        const productResults = await this.searchRepository.searchProducts(term);
        results.push(...productResults);
      })
    );

    const uniqueMap = new Map<bigint, ProductSearchResult>();
    for (const item of results) {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    }
    
    return Array.from(uniqueMap.values());
  }

  async searchProductV2(keyword: string): Promise<LoomSearchResult> {
    const products = await this.searchProduct(keyword);
    
    return {
      product: {
        resultSet: products,
        relatedResultSet: []
      }
    };
  }

  async searchBlogs(keyword: string) {
    return this.searchRepository.searchBlogs(keyword);
  }

  async searchStories(keyword: string) {
    return this.searchRepository.searchStories(keyword);
  }
}
