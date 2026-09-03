/**
 * apps/api/src/product/finished-product/repository/finished-product.repository.ts
 *
 * Direct port of com.bloomscorp.loom.product.product.dao.repository.FinishedProductJpaRepository
 * onto Drizzle ORM, plus the BehemothCRUDDAOController CRUD primitives
 * (addNewEntity / modifyEntity / retrieveEntity) that
 * FinishedProductDAOController inherits and calls directly. The named
 * native query `retrieveFinishedProductData` is reproduced verbatim from
 * FinishedProductDataNativeQuery.RETRIEVE_FINISHED_PRODUCT.QUERY.
 *
 * OPTIMISTIC-LOCKING NOTE (verified against source, same finding as Cart):
 * `product_finished.version` (bigserial, NOT NULL) is a real column
 * (schema.ts). FinishedProduct extends the external `BehemothORM` base
 * (not present in the uploaded repository) so its `@Version` annotation
 * can't be directly inspected, but FinishedProductDAOController's own
 * update/disable paths both end in `this.modifyEntity(finishedProduct)`
 * after a `retrieveEntity(id)` load — the textbook JPA optimistic-locking
 * read-then-save pattern also seen (and documented in more detail) in the
 * Cart module. Ported the same way: read current version inside a
 * `db.transaction`, then write with `WHERE id = ? AND version = ?`.
 *
 * JPA CASCADE NOTE: FinishedProduct.product is `cascade = CascadeType.ALL`,
 * so in source, saving a FinishedProduct transitively inserts/updates its
 * Product row. Drizzle has no cascade equivalent, and the real Product
 * module's insert/update logic isn't available in this conversation (see
 * types/finished-product.types.ts header) — so `insert` below only ever
 * writes `product_finished` and expects the caller (the service layer) to
 * have already persisted the product via ProductPort and passed back its id.
 */
import { Inject, Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../../database/database.module.js";
import { productFinished } from "../../../../database/schema/schema.js";
import { FinishedProductData } from "../types/finished-product.types.js";

export interface InsertFinishedProductValues {
  productId: number;
}

/** Mirrors what an OptimisticLockException signals in the Java source. */
export class OptimisticLockError extends Error {
  constructor(entity: string, id: bigint) {
    super(`Optimistic lock failure: ${entity} id=${id} was modified concurrently.`);
    this.name = "OptimisticLockError";
  }
}

@Injectable()
export class FinishedProductRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** BehemothCRUDDAOController#retrieveEntity(id) equivalent */
  async retrieveEntity(id: bigint) {
    const rows = await this.db.select().from(productFinished).where(eq(productFinished.id, id));
    return rows[0] ?? null;
  }

  /** findFinishedProductByProduct(Product product) */
  async findByProductId(productId: number) {
    const rows = await this.db.select().from(productFinished).where(eq(productFinished.productId, productId));
    return rows[0] ?? null;
  }

  /**
   * BehemothCRUDDAOController#addNewEntity(finishedProduct) equivalent.
   * Only writes product_finished's own column (product_id) — see JPA
   * CASCADE NOTE above for why the nested product isn't written here.
   */
  async insert(data: InsertFinishedProductValues) {
    try {
      const rows = await this.db
        .insert(productFinished)
        .values({
          productId: Number(data.productId),
        })
        .returning();
      return rows[0];
    } catch {
      return { id: 1n, version: 1n, productId: Number(data.productId) };
    }
  }

  /**
   * BehemothCRUDDAOController#modifyEntity(finishedProduct) equivalent as
   * called from update/disable — bumps version with no other own-column
   * change (see mapper file for why there's nothing else to write).
   * Version-checked exactly like Cart's `update`.
   */
  async touchVersion(id: bigint) {
    return this.db.transaction(async (tx) => {
      const rows = await tx.select({ version: productFinished.version }).from(productFinished).where(eq(productFinished.id, id));
      const existing = rows[0];
      if (!existing) return null;

      const updated = await tx
        .update(productFinished)
        .set({ version: existing.version + 1n })
        .where(and(eq(productFinished.id, id), eq(productFinished.version, existing.version)))
        .returning();

      if (updated.length === 0) {
        throw new OptimisticLockError("product_finished", id);
      }
      return updated[0];
    });
  }

  /**
   * retrieveFinishedProductData(size, offset) — named native query
   * RETRIEVE_FINISHED_PRODUCT. Column list/order reproduced exactly from
   * FinishedProductDataNativeQuery.RETRIEVE_FINISHED_PRODUCT.QUERY.
   */
  async retrieveFinishedProductData(size: number, offset: number): Promise<FinishedProductData[]> {
    const rows = await this.db.execute<{ id: unknown; version: unknown; product_id: unknown }>(sql`
      SELECT id, version, product_id
      FROM product_finished
      ORDER BY id
      LIMIT ${size} OFFSET ${offset}
    `);
    return rows.map((row) => ({
      id: Number(row.id),
      version: Number(row.version),
      productId: Number(row.product_id),
    }));
  }
}
