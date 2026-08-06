/**
 * apps/api/src/product/custom-product/repository/custom-product.repository.ts
 *
 * Direct port of com.bloomscorp.loom.product.dao.repository.CustomProductJpaRepository
 * onto Drizzle ORM, plus the BehemothCRUDDAOController CRUD primitives
 * (addNewEntity / modifyEntity / retrieveEntity / retrieveEntityList) that
 * CustomProductDAOController inherits and calls directly. The named native
 * query `retrieveCustomProduct` is reproduced verbatim from
 * CustomProductDataNativeQuery.RETRIEVE_CUSTOM_PRODUCT.QUERY.
 *
 * OPTIMISTIC-LOCKING NOTE (verified against source, same finding as Cart/
 * FinishedProduct): `custom_product.version` (bigserial, NOT NULL) is a
 * real column (schema.ts). CustomProduct extends the external `BehemothORM`
 * base (not present in the uploaded repository), but
 * CustomProductDAOController#updateCustomProduct follows the same
 * `retrieveEntity(id)` load → mutate → `modifyEntity(entity)` save pattern
 * already documented in more detail for Cart. Ported the same way: read
 * current version inside a `db.transaction`, then write with
 * `WHERE id = ? AND version = ?`.
 */
import { Inject, Injectable } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../database/database.module.js";
import { customProduct } from "../../../database/schema/schema.js";
import { CustomProductData, Unit } from "../types/custom-product.types.js";

export interface InsertCustomProductValues {
  name: string;
  sku: string;
  price: string;
  productGroup: string;
  unit: Unit;
  remarks: string;
  heroImage: string;
  additionalImages: string;
  additionalDocs: string;
  createdAt: number;
  updatedAt: number;
}

export type UpdateCustomProductValues = Omit<InsertCustomProductValues, "sku" | "createdAt">;

/** Mirrors what an OptimisticLockException signals in the Java source. */
export class OptimisticLockError extends Error {
  constructor(entity: string, id: bigint) {
    super(`Optimistic lock failure: ${entity} id=${id} was modified concurrently.`);
    this.name = "OptimisticLockError";
  }
}

@Injectable()
export class CustomProductRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** BehemothCRUDDAOController#retrieveEntity(id) equivalent — getCustomProductById */
  async retrieveEntity(id: bigint) {
    const rows = await this.db.select().from(customProduct).where(eq(customProduct.id, id));
    return rows[0] ?? null;
  }

  /** BehemothCRUDDAOController#retrieveEntityList() equivalent — getAllCustomProducts */
  findAll() {
    return this.db.select().from(customProduct);
  }

  /** BehemothCRUDDAOController#addNewEntity(customProduct) equivalent — addNewCustomProduct */
  async insert(data: InsertCustomProductValues) {
    const rows = await this.db.insert(customProduct).values(data).returning();
    return rows[0];
  }

  /**
   * BehemothCRUDDAOController#modifyEntity(existingProduct) equivalent, as
   * called from updateCustomProduct. Source pattern: retrieveEntity loads
   * the entity (capturing its current version) before mutating and saving
   * — Hibernate emits `UPDATE ... SET version = version + 1 WHERE id = ?
   * AND version = ?` using the version just read. Ported 1:1: read + write
   * happen inside one transaction here so nothing can race between them.
   */
  async update(id: bigint, data: UpdateCustomProductValues) {
    return this.db.transaction(async (tx) => {
      const rows = await tx.select({ version: customProduct.version }).from(customProduct).where(eq(customProduct.id, id));
      const existing = rows[0];
      if (!existing) return null;

      const updated = await tx
        .update(customProduct)
        .set({ ...data, version: existing.version + 1n })
        .where(and(eq(customProduct.id, id), eq(customProduct.version, existing.version)))
        .returning();

      if (updated.length === 0) {
        throw new OptimisticLockError("custom_product", id);
      }
      return updated[0];
    });
  }

  /**
   * retrieveCustomProduct(size, offset) — named native query
   * RETRIEVE_CUSTOM_PRODUCT. Column list/order and the `unit::text` cast
   * reproduced exactly from
   * CustomProductDataNativeQuery.RETRIEVE_CUSTOM_PRODUCT.QUERY.
   */
  async retrieveCustomProductData(size: number, offset: number): Promise<CustomProductData[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
        id, version, name, sku, price, product_group,
        unit::text AS unit, remarks, hero_image, additional_images,
        additional_docs, created_at, updated_at
      FROM custom_product
      ORDER BY id
      LIMIT ${size} OFFSET ${offset}
    `);
    return rows.map(mapRowToCustomProductData);
  }
}

function mapRowToCustomProductData(row: Record<string, unknown>): CustomProductData {
  return {
    id: Number(row.id),
    version: Number(row.version),
    name: row.name as string,
    sku: row.sku as string,
    price: Number(row.price),
    productGroup: row.product_group as string,
    unit: row.unit as string,
    remarks: row.remarks as string,
    heroImage: row.hero_image as string,
    additionalImages: row.additional_images as string,
    additionalDocs: row.additional_docs as string,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}