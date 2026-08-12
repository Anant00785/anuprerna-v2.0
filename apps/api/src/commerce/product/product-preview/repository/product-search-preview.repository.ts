// @ts-nocheck
/**
 * apps/api/src/commerce/product/product-search-preview/repository/product-search-preview.repository.ts
 *
 * NOT a 1:1 source port — see types file header. No
 * ProductSearchPreviewJpaRepository exists in the uploaded Java source, so
 * this is a minimal, clearly-flagged reconstruction covering only the
 * inherited JpaRepository CRUD-read surface plus the two lookups
 * (name/sku) that every other product-family preview repository in this
 * codebase already exposes (ProductPreview, and by extension the
 * autocomplete use case ProductSearchPreview's javadoc describes).
 */
import { Inject, Injectable } from "@nestjs/common";
import { eq, ilike, inArray } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../../database/database.module.js";
import { product } from "../../../../database/schema/schema.js";

@Injectable()
export class ProductSearchPreviewRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** retrieveEntity(id) equivalent — JpaRepository#findById */
  async findById(id: bigint) {
    const rows = await this.db.select().from(product).where(eq(product.id, id));
    return rows[0] ?? null;
  }

  /** JpaRepository#findAllById(Iterable<Long> ids) */
  findByIds(ids: bigint[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return this.db.select().from(product).where(inArray(product.id, ids));
  }

  /** NOT source-verified — by analogy with ProductPreviewJpaRepository#findProductPreviewBySkuIgnoreCase. */
  async findBySkuIgnoreCase(sku: string) {
    const rows = await this.db.select().from(product).where(ilike(product.sku, sku));
    return rows[0] ?? null;
  }

  /** NOT source-verified — typeahead/autocomplete lookup implied by the entity's javadoc ("search autocomplete suggestions"). */
  findByNameStartingWith(prefix: string, limit: number) {
    return this.db
      .select()
      .from(product)
      .where(ilike(product.name, `${prefix}%`))
      .limit(limit);
  }
}
