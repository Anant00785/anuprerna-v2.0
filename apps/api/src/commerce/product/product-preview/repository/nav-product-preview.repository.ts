// @ts-nocheck
/**
 * apps/api/src/commerce/product/nav-product-preview/repository/nav-product-preview.repository.ts
 *
 * Direct port of com.bloomscorp.loom.product.product.dao.repository.NavProductPreviewJpaRepository
 * onto Drizzle ORM against the `product` table.
 */
import { Inject, Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../../database/database.module.js";
import { product } from "../../../../database/schema/schema.js";

@Injectable()
export class NavProductPreviewRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** findProductPreviewByProductGroupAndDisabledFalse(String group) */
  findByProductGroupActive(group: string) {
    return this.db
      .select()
      .from(product)
      .where(and(eq(product.productGroup, group), eq(product.disabled, false)));
  }

  /** retrieveEntity(id) equivalent */
  async findById(id: bigint) {
    const rows = await this.db.select().from(product).where(eq(product.id, id));
    return rows[0] ?? null;
  }
}
