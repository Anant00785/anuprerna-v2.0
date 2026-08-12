// @ts-nocheck
/**
 * apps/api/src/commerce/product/finished-preview/repository/finished-preview.repository.ts
 *
 * Direct port of com.bloomscorp.loom.product.product.dao.repository.FinishedPreviewJpaRepository
 * onto Drizzle ORM against `product_finished` joined to `product`.
 */
import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../../database/database.module.js";
import { product, productFinished } from "../../../../database/schema/schema.js";

@Injectable()
export class FinishedPreviewRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * findAllByProductDisabledFalse() — source filters on the joined
   * product's `disabled` flag, so this joins product_finished to product.
   */
  async findAllActive() {
    const rows = await this.db
      .select({ finished: productFinished })
      .from(productFinished)
      .innerJoin(product, eq(productFinished.productId, product.id))
      .where(eq(product.disabled, false));
    return rows.map((r) => r.finished);
  }

  /** retrieveEntity(id) equivalent */
  async findById(id: bigint) {
    const rows = await this.db.select().from(productFinished).where(eq(productFinished.id, id));
    return rows[0] ?? null;
  }

  /**
   * NOT source-verified: FinishedPreviewJpaRepository only declares
   * findAllByProductDisabledFalse() in the uploaded source. Added here,
   * by analogy with FabricPreviewJpaRepository#findFabricPreviewByProduct,
   * purely so FinishedPreviewService can resolve a single finished preview
   * from a product id without a full table scan. Remove if it turns out
   * the real interface never needed this.
   */
  async findByProductId(productId: number) {
    const rows = await this.db.select().from(productFinished).where(eq(productFinished.productId, productId));
    return rows[0] ?? null;
  }
}
