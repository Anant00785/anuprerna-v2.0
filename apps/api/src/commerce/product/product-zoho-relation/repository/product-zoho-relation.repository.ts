// @ts-nocheck
/**
 * apps/api/src/commerce/product-zoho-relation/repository/product-zoho-relation.repository.ts
 *
 * Direct port of com.bloomscorp.loom.product.product.dao.repository.ProductZohoRelationJpaRepository
 * onto Drizzle ORM, plus the CRUD/query surface exposed by
 * ProductZohoRelationDAOController. Native SQL (retrieveProductZohoRelation,
 * retrieveProductZohoRelationById) is reproduced verbatim via
 * `db.execute(sql\`...\`)`. Nothing here is invented beyond what's in source.
 *
 * STREAMING NOTE (flagged, not silently dropped): source's
 * `streamAllByFinishedProduct` / `streamAllByFabricProduct` return a JPA
 * `Stream<ProductZohoRelation>` with `@QueryHints(HINT_FETCH_SIZE=500)` for
 * memory-efficient bulk processing. Drizzle's query builder has no
 * repository-level equivalent of a JPA streaming result set — reproducing
 * the exact fetch-size/backpressure behavior would require dropping to the
 * underlying `postgres.js` client's own cursor API directly, which isn't
 * available through the injected `Database` handle used elsewhere in this
 * module. Both methods below materialize the full result set instead of
 * streaming it; the *filter* semantics (productGroup, includeDisabled) are
 * ported exactly. Flagged here rather than silently reproduced as
 * source-verified streaming behavior — revisit if a full Zoho bulk export
 * job is later built on top of this.
 *
 * OPTIMISTIC LOCKING NOTE (verified against source, same reasoning as
 * cart.repository.ts / product-size-profile.repository.ts):
 * `product_zoho_relation.version` (bigserial, NOT NULL) is a real column
 * (database.zip schema.ts). `ProductZohoRelation` extends the external
 * `BehemothORM` base class (not present in the uploaded repository), so its
 * `@Version` annotation can't be directly inspected, but base CRUD's
 * modifyEntity/deleteEntityByID follow the same find-then-version-checked-
 * write pattern already confirmed for Cart and ProductSizeProfile. Ported
 * 1:1: read current version inside a `db.transaction`, then write with
 * `WHERE id = ? AND version = ?`.
 */
import { Inject, Injectable } from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../../database/database.module.js";
import { product, productZohoRelation } from "../../../../database/schema/schema.js";
import { ProductZohoRelationData } from "../types/product-zoho-relation.types.js";
import { toData } from "../mapper/product-zoho-relation.mapper.js";

export interface InsertProductZohoRelationValues {
  productId: number;
  sku: string;
  zohoItemId: string;
  hsnCode: string;
  purchasePrice: string;
  tax: string;
  disabled: boolean;
}

export type UpdateProductZohoRelationValues = InsertProductZohoRelationValues;

/** Mirrors what an OptimisticLockException signals in the Java source. */
export class OptimisticLockError extends Error {
  constructor(entity: string, id: bigint) {
    super(`Optimistic lock failure: ${entity} id=${id} was modified concurrently.`);
    this.name = "OptimisticLockError";
  }
}

@Injectable()
export class ProductZohoRelationRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** BehemothCRUDDAOController#addNewEntity(productZohoRelation) equivalent */
  async insert(data: InsertProductZohoRelationValues) {
    const rows = await this.db.insert(productZohoRelation).values(data).returning();
    return rows[0];
  }

  /**
   * BehemothCRUDDAOController#modifyEntity(productZohoRelation) equivalent.
   * Read + write happen inside one transaction so nothing can race between
   * them, matching cart.repository.ts#update / product-size-profile.repository.ts#update.
   */
  async update(id: bigint, data: UpdateProductZohoRelationValues) {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .select({ version: productZohoRelation.version })
        .from(productZohoRelation)
        .where(eq(productZohoRelation.id, id));
      const existing = rows[0];
      if (!existing) return null;

      const updated = await tx
        .update(productZohoRelation)
        .set({ ...data, version: existing.version + 1n })
        .where(and(eq(productZohoRelation.id, id), eq(productZohoRelation.version, existing.version)))
        .returning();

      if (updated.length === 0) {
        throw new OptimisticLockError("product_zoho_relation", id);
      }
      return updated[0];
    });
  }

  /** retrieveProductZohoRelationById(Long id) -> BehemothCRUDDAOController#retrieveEntity(id) */
  async findById(id: bigint) {
    const rows = await this.db.select().from(productZohoRelation).where(eq(productZohoRelation.id, id));
    return rows[0] ?? null;
  }

  /**
   * deleteProductZohoRelation(Long id) -> BehemothCRUDDAOController#deleteEntityByID(id),
   * version-checked exactly like update() above.
   */
  async deleteById(id: bigint): Promise<number> {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .select({ version: productZohoRelation.version })
        .from(productZohoRelation)
        .where(eq(productZohoRelation.id, id));
      const existing = rows[0];
      if (!existing) return 0;

      const deleted = await tx
        .delete(productZohoRelation)
        .where(and(eq(productZohoRelation.id, id), eq(productZohoRelation.version, existing.version)))
        .returning({ id: productZohoRelation.id });

      if (deleted.length === 0) {
        throw new OptimisticLockError("product_zoho_relation", id);
      }
      return deleted.length;
    });
  }

  /** findProductZohoRelationByProductAndSku(Product product, String sku) */
  async findByProductIdAndSku(productId: number, sku: string) {
    const rows = await this.db
      .select()
      .from(productZohoRelation)
      .where(and(eq(productZohoRelation.productId, productId), eq(productZohoRelation.sku, sku)));
    return rows[0] ?? null;
  }

  /** findProductZohoRelationByZohoItemIdAndSku(String zohoItemId, String sku) */
  async findByZohoItemIdAndSku(zohoItemId: string, sku: string) {
    const rows = await this.db
      .select()
      .from(productZohoRelation)
      .where(and(eq(productZohoRelation.zohoItemId, zohoItemId), eq(productZohoRelation.sku, sku)));
    return rows[0] ?? null;
  }

  /** findProductZohoRelationByZohoItemId(String zohoItemId) */
  async findByZohoItemId(zohoItemId: string) {
    const rows = await this.db
      .select()
      .from(productZohoRelation)
      .where(eq(productZohoRelation.zohoItemId, zohoItemId));
    return rows[0] ?? null;
  }

  /**
   * findAllByDisabledFalse() — source JPQL:
   *   SELECT r FROM product_zoho_relation r JOIN FETCH r.product p
   *   WHERE r.disabled = false AND p.disabled = false
   */
  findAllActiveWithActiveProduct() {
    return this.db
      .select({ relation: productZohoRelation, product })
      .from(productZohoRelation)
      .innerJoin(product, eq(productZohoRelation.productId, product.id))
      .where(and(eq(productZohoRelation.disabled, false), eq(product.disabled, false)));
  }

  /**
   * streamAllByFinishedProduct(boolean includeDisabled) — source JPQL:
   *   SELECT r FROM product_zoho_relation r JOIN FETCH r.product p
   *   WHERE p.productGroup = 'finished' AND (:includeDisabled = true OR p.disabled = false)
   * See STREAMING NOTE above — materializes the full result set.
   */
  streamAllByFinishedProduct(includeDisabled: boolean) {
    return this.db
      .select({ relation: productZohoRelation, product })
      .from(productZohoRelation)
      .innerJoin(product, eq(productZohoRelation.productId, product.id))
      .where(
        and(
          eq(product.productGroup, "finished"),
          includeDisabled ? undefined : eq(product.disabled, false),
        ),
      );
  }

  /**
   * streamAllByFabricProduct(boolean includeDisabled) — source JPQL:
   *   SELECT r FROM product_zoho_relation r JOIN FETCH r.product p
   *   WHERE p.productGroup = 'fabric' AND (:includeDisabled = true OR p.disabled = false)
   * See STREAMING NOTE above — materializes the full result set.
   */
  streamAllByFabricProduct(includeDisabled: boolean) {
    return this.db
      .select({ relation: productZohoRelation, product })
      .from(productZohoRelation)
      .innerJoin(product, eq(productZohoRelation.productId, product.id))
      .where(
        and(
          eq(product.productGroup, "fabric"),
          includeDisabled ? undefined : eq(product.disabled, false),
        ),
      );
  }

  /**
   * retrieveProductZohoRelation(size, offset) — named native query
   * RETRIEVE_PRODUCT_ZOHO_RELATION. Column list and order reproduced
   * exactly from ProductZohoRelationNativeQuery.RETRIEVE_PRODUCT_ZOHO_RELATION.QUERY.
   */
  async retrieveProductZohoRelationData(size: number, offset: number): Promise<ProductZohoRelationData[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
        id, version, product_id, sku, zoho_item_id, hsn_code, purchase_price, tax, disabled
      FROM product_zoho_relation
      ORDER BY id
      LIMIT ${size} OFFSET ${offset}
    `);
    return rows.map(toData);
  }

  /**
   * retrieveProductZohoRelationDataById(id) — named native query
   * RETRIEVE_PRODUCT_ZOHO_RELATION_BY_ID. Identical column list/order to
   * the paginated query, filtered by id.
   */
  async retrieveProductZohoRelationDataById(id: bigint): Promise<ProductZohoRelationData | null> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
        id, version, product_id, sku, zoho_item_id, hsn_code, purchase_price, tax, disabled
      FROM product_zoho_relation
      WHERE id = ${id}
    `);
    return rows[0] ? toData(rows[0]) : null;
  }
}
