// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { SearchRepository } from "../repository/search.repository.js";
import { ProductSearchResult, LoomSearchResult } from "../types/search.types.js";

@Injectable()
export class SearchService {
  constructor(private readonly searchRepository: SearchRepository) {}

  async searchProduct(keyword: string): Promise<ProductSearchResult[]> {
    // Process comma separated terms like Java code
    const terms = [...new Set(keyword.split(",").map(t => t.trim()).filter(t => t.length > 0))];
    const results: ProductSearchResult[] = [];
    
    // In Java, it uses stream().parallel().forEach(), we can just Promise.all
    await Promise.all(
      terms.map(async (term) => {
        const productResults = await this.searchRepository.searchProducts(term);
        results.push(...productResults);
      })
    );

    // Deduplicate by ID
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
}
