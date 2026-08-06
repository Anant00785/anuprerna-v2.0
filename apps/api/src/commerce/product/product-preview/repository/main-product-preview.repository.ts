/**
 * apps/api/src/commerce/product/main-product-preview/repository/main-product-preview.repository.ts
 *
 * Direct port of com.bloomscorp.loom.product.product.dao.repository.MainProductPreviewJpaRepository
 * onto Drizzle ORM against the `product` table.
 */
import { Inject, Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../../database/database.module.js";
import { product } from "../../../../database/schema/schema.js";

@Injectable()
export class MainProductPreviewRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** findAllByMainProductId(Long id) — includes disabled variants. */
  findAllByMainProductId(mainProductId: number) {
    return this.db.select().from(product).where(eq(product.mainProductId, mainProductId));
  }

  /** findAllByMainProductIdAndDisabledFalse(Long mainProductId) */
  findAllActiveByMainProductId(mainProductId: number) {
    return this.db
      .select()
      .from(product)
      .where(and(eq(product.mainProductId, mainProductId), eq(product.disabled, false)));
  }

  /** retrieveEntity(id) equivalent */
  async findById(id: bigint) {
    const rows = await this.db.select().from(product).where(eq(product.id, id));
    return rows[0] ?? null;
  }
}
