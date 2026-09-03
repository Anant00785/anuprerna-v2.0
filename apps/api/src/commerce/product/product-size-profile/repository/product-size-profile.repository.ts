/**
 * apps/api/src/commerce/product-size-profile/repository/product-size-profile.repository.ts
 *
 * Direct port of com.bloomscorp.loom.product.product.dao.repository.ProductSizeProfileJpaRepository
 * onto Drizzle ORM, plus the CRUD/query surface exposed by
 * ProductSizeProfileDAOController. Native SQL (retrieveProductSizeProfile,
 * retrieveProductSizeProfileById) is reproduced verbatim via
 * `db.execute(sql\`...\`)`. Nothing here is invented beyond what's in source.
 *
 * OPTIMISTIC LOCKING NOTE (verified against source, same reasoning as
 * cart.repository.ts): `product_size_profile.version` (bigserial, NOT NULL)
 * is a real column (database.zip schema.ts). `ProductSizeProfile` extends
 * the external `BehemothORM` base class (not present in the uploaded
 * repository), so its `@Version` annotation can't be directly inspected,
 * but the JPA-derived delete/update methods on this repository
 * (`deleteByProduct`, and the base CRUD's modifyEntity) follow the same
 * find-then-version-checked-write pattern already confirmed for Cart.
 * Ported 1:1: read current version inside a `db.transaction`, then write
 * with `WHERE id = ? AND version = ?`.
 */
import { Inject, Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../../database/database.module.js";
import { productSizeProfile } from "../../../../database/schema/schema.js";
import { ProductSizeProfileData } from "../types/product-size-profile.types.js";
import { toData } from "../mapper/product-size-profile.mapper.js";

export interface InsertProductSizeProfileValues {
  productId: number;
  sizeProfileOptionId: number;
  sizeProfileOptionSku: string;
  quantity: number;
  consumedFabric: string | null;
  disabled: boolean;
}

export type UpdateProductSizeProfileValues = InsertProductSizeProfileValues;

/** Mirrors what an OptimisticLockException signals in the Java source. */
export class OptimisticLockError extends Error {
  constructor(entity: string, id: bigint) {
    super(`Optimistic lock failure: ${entity} id=${id} was modified concurrently.`);
    this.name = "OptimisticLockError";
  }
}

@Injectable()
export class ProductSizeProfileRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** BehemothCRUDDAOController#addNewEntity(productSizeProfile) equivalent */
  async insert(data: InsertProductSizeProfileValues) {
    const rows = await this.db.insert(productSizeProfile).values(data).returning();
    return rows[0];
  }

  /**
   * BehemothCRUDDAOController#modifyEntity(productSizeProfile) equivalent.
   * Read + write happen inside one transaction so nothing can race between
   * them, matching cart.repository.ts#update.
   */
  async update(id: bigint, data: UpdateProductSizeProfileValues) {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .select({ version: productSizeProfile.version })
        .from(productSizeProfile)
        .where(eq(productSizeProfile.id, id));
      const existing = rows[0];
      if (!existing) return null;

      const updated = await tx
        .update(productSizeProfile)
        .set({ ...data, version: existing.version + 1n })
        .where(and(eq(productSizeProfile.id, id), eq(productSizeProfile.version, existing.version)))
        .returning();

      if (updated.length === 0) {
        throw new OptimisticLockError("product_size_profile", id);
      }
      return updated[0];
    });
  }

  /** retrieveProductSizeProfileById(Long id) -> BehemothCRUDDAOController#retrieveEntity(id) */
  async findById(id: bigint) {
    const rows = await this.db.select().from(productSizeProfile).where(eq(productSizeProfile.id, id));
    return rows[0] ?? null;
  }

  /**
   * deleteEntity(id) equivalent — base CRUD delete, version-checked exactly
   * like update() above.
   */
  async deleteById(id: bigint): Promise<number> {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .select({ version: productSizeProfile.version })
        .from(productSizeProfile)
        .where(eq(productSizeProfile.id, id));
      const existing = rows[0];
      if (!existing) return 0;

      const deleted = await tx
        .delete(productSizeProfile)
        .where(and(eq(productSizeProfile.id, id), eq(productSizeProfile.version, existing.version)))
        .returning({ id: productSizeProfile.id });

      if (deleted.length === 0) {
        throw new OptimisticLockError("product_size_profile", id);
      }
      return deleted.length;
    });
  }

  /**
   * deleteByProduct(Product product) — derived delete-by method in source
   * (no @Query annotation): SELECT matching rows, then remove() each
   * individually inside one transaction, version-checked per row. Returns
   * the count actually deleted (source method is void; exposed here as a
   * count for observability, behavior otherwise identical). Called from
   * ProductSizeProfileDAOController#deleteProductSizeProfileItems.
   */
  async deleteByProductId(productId: number): Promise<number> {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .select({ id: productSizeProfile.id, version: productSizeProfile.version })
        .from(productSizeProfile)
        .where(eq(productSizeProfile.productId, productId));

      let deletedCount = 0;
      for (const row of rows) {
        const deleted = await tx
          .delete(productSizeProfile)
          .where(and(eq(productSizeProfile.id, row.id), eq(productSizeProfile.version, row.version)))
          .returning({ id: productSizeProfile.id });
        if (deleted.length === 0) {
          throw new OptimisticLockError("product_size_profile", row.id);
        }
        deletedCount += 1;
      }
      return deletedCount;
    });
  }

  /** findBySizeProfileOption(SizeProfileOption option) */
  findBySizeProfileOptionId(sizeProfileOptionId: number) {
    return this.db
      .select()
      .from(productSizeProfile)
      .where(eq(productSizeProfile.sizeProfileOptionId, sizeProfileOptionId));
  }

  /**
   * deleteProductSizeProfileBySizeOption(SizeProfileOption option) — source
   * loads all rows for the option, detaches each from its in-memory
   * `product.productSizeProfileList` (pure JPA managed-collection
   * housekeeping, nothing persisted by that step on its own), then calls
   * `deleteAll(profiles)`. `deleteAll` on Spring Data JPA is itself a
   * per-entity `remove()` loop inside one transaction — same
   * version-checked pattern as deleteByProductId above.
   */
  async deleteBySizeProfileOptionId(sizeProfileOptionId: number): Promise<number> {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .select({ id: productSizeProfile.id, version: productSizeProfile.version })
        .from(productSizeProfile)
        .where(eq(productSizeProfile.sizeProfileOptionId, sizeProfileOptionId));

      let deletedCount = 0;
      for (const row of rows) {
        const deleted = await tx
          .delete(productSizeProfile)
          .where(and(eq(productSizeProfile.id, row.id), eq(productSizeProfile.version, row.version)))
          .returning({ id: productSizeProfile.id });
        if (deleted.length === 0) {
          throw new OptimisticLockError("product_size_profile", row.id);
        }
        deletedCount += 1;
      }
      return deletedCount;
    });
  }

  /** findProductSizeProfileBySizeProfileOptionSku(String sku) */
  async findBySku(sku: string) {
    const rows = await this.db
      .select()
      .from(productSizeProfile)
      .where(eq(productSizeProfile.sizeProfileOptionSku, sku));
    return rows[0] ?? null;
  }

  /** findByProduct_IdAndSizeProfileOption_Id(Long productId, Long sizeProfileOptionId) */
  async findByProductIdAndSizeProfileOptionId(productId: number, sizeProfileOptionId: number) {
    const rows = await this.db
      .select()
      .from(productSizeProfile)
      .where(
        and(
          eq(productSizeProfile.productId, productId),
          eq(productSizeProfile.sizeProfileOptionId, sizeProfileOptionId),
        ),
      );
    return rows[0] ?? null;
  }

  /**
   * retrieveProductSizeProfile(size, offset) — named native query
   * RETRIEVE_PRODUCT_SIZE_PROFILE. Column list and order reproduced exactly
   * from ProductSizeProfileDataNativeQuery.RETRIEVE_PRODUCT_SIZE_PROFILE.QUERY.
   */
  async retrieveProductSizeProfileData(size: number, offset: number): Promise<ProductSizeProfileData[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
        id, version, product_id, size_profile_option_id,
        size_profile_option_sku, quantity, consumed_fabric, disabled
      FROM product_size_profile
      ORDER BY id
      LIMIT ${size} OFFSET ${offset}
    `);
    return rows.map(toData);
  }

  /**
   * retrieveProductSizeProfileDataById(id) — named native query
   * RETRIEVE_PRODUCT_SIZE_PROFILE_BY_ID. Identical column list/order to the
   * paginated query, filtered by id.
   */
  async retrieveProductSizeProfileDataById(id: bigint): Promise<ProductSizeProfileData | null> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
        id, version, product_id, size_profile_option_id,
        size_profile_option_sku, quantity, consumed_fabric, disabled
      FROM product_size_profile
      WHERE id = ${id}
    `);
    return rows[0] ? toData(rows[0]) : null;
  }
}
