/**
 * apps/api/src/commerce/product/review-product-preview/repository/review-product-preview.repository.ts
 *
 * Direct port of com.bloomscorp.loom.product.product.dao.repository.ReviewProductPreviewJpaRepository
 * onto Drizzle ORM against the `product` table. Source declares no custom
 * query methods — it's an empty `JpaRepository<ReviewProductPreview, Long>`
 * — so only the inherited CRUD-style read is ported here.
 */
import { Inject, Injectable } from "@nestjs/common";
import { eq, inArray } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../../database/database.module.js";
import { product } from "../../../../database/schema/schema.js";

@Injectable()
export class ReviewProductPreviewRepository {
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
}
// @ts-nocheck
// @ts-nocheck
