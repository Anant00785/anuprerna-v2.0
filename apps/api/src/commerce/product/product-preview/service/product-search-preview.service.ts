/**
 * apps/api/src/commerce/product/product-search-preview/service/product-search-preview.service.ts
 *
 * NOT a 1:1 source port — see types/repository file headers. Minimal,
 * clearly-flagged reconstruction of the read surface the entity's javadoc
 * describes (autocomplete, SKU/name quick lookups, admin dropdowns, main
 * product/variant queries).
 */
import { Injectable } from "@nestjs/common";
import { ProductSearchPreviewRepository } from "../repository/product-search-preview.repository.js";
import { toView } from "../mapper/product-search-preview.mapper.js";
import { ProductSearchPreviewView } from "../types/product-search-preview.types.js";

@Injectable()
export class ProductSearchPreviewService {
  constructor(private readonly repo: ProductSearchPreviewRepository) {}

  /** retrieveEntity(id) */
  async retrieveEntity(id: bigint): Promise<ProductSearchPreviewView | null> {
    const row = await this.repo.findById(id);
    return row ? toView(row) : null;
  }

  /** retrieveEntities(ids) — bulk lookup for report/dashboard rendering. */
  async retrieveEntities(ids: bigint[]): Promise<ProductSearchPreviewView[]> {
    const rows = await this.repo.findByIds(ids);
    return rows.map(toView);
  }

  /** findBySkuIgnoreCase(sku) */
  async findBySku(sku: string): Promise<ProductSearchPreviewView | null> {
    const row = await this.repo.findBySkuIgnoreCase(sku);
    return row ? toView(row) : null;
  }

  /** autocomplete(prefix, limit) — typeahead suggestions. */
  async autocomplete(prefix: string, limit = 10): Promise<ProductSearchPreviewView[]> {
    const rows = await this.repo.findByNameStartingWith(prefix, limit);
    return rows.map(toView);
  }
}
