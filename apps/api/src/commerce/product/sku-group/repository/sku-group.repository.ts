/**
 * apps/api/src/product/sku_group/SkuGroup.repository.ts
 *
 * Direct port of com.bloomscorp.loom.product.sku_group.dao.repository.SkuGroupJpaRepository
 * (and the BehemothCRUDDAOController base methods SkuGroupDaoController
 * relies on) onto Drizzle ORM. The two named native queries
 * (RETRIEVE_SKU_GROUP / RETRIEVE_SKU_GROUP_BY_ID) are reproduced verbatim
 * via `db.execute(sql\`...\`)`, column list and order taken directly from
 * SkuGroupNativeQuery.java. Nothing here is invented.
 *
 * OPTIMISTIC-LOCKING NOTE (verified against source): `sku_group.version`
 * (bigserial, NOT NULL) is a real column (schema.ts), inherited from the
 * external `BehemothORM` base class (not present in the uploaded
 * repository) the same way `cart_item.version` is. SkuGroupDaoController's
 * `updateSkuGroup` follows the identical textbook JPA optimistic-locking
 * pattern already ported for Cart: `retrieveEntity(id)` loads the row
 * (capturing its current version) inside the same call, mutates it, then
 * saves — Hibernate emits `UPDATE ... SET version = version + 1 WHERE id =
 * ? AND version = ?`. Ported 1:1 here: read current version inside a
 * `db.transaction`, then write with `WHERE id = ? AND version = ?`,
 * surfacing a 0-row race as `OptimisticLockError`, exactly like
 * commerce/cart/repository/cart.repository.ts.
 */
import { Inject, Injectable } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../../database/database.module.js";
import { skuGroup } from "../../../../database/schema/schema.js";
import { SkuGroupData, SkuGroupEntity } from "../types/sku-group.types.js";

export interface InsertSkuGroupValues {
  name: string;
  timeOfCreation: number;
}

export interface UpdateSkuGroupValues {
  name: string;
}

/** Mirrors what an OptimisticLockException signals in the Java source. */
export class OptimisticLockError extends Error {
  constructor(entity: string, id: bigint) {
    super(`Optimistic lock failure: ${entity} id=${id} was modified concurrently.`);
    this.name = "OptimisticLockError";
  }
}

@Injectable()
export class SkuGroupRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** SkuGroupDaoController#retrieveSkuGroupList — this.getRepository().findAll() */
  async findAll(): Promise<SkuGroupEntity[]> {
    const rows = await this.db.select().from(skuGroup);
    return rows.map(mapRowToEntity);
  }

  /** BehemothCRUDDAOController#retrieveEntity(id) equivalent, used by retrieveSkuGroupById */
  async retrieveEntity(id: bigint): Promise<SkuGroupEntity | null> {
    const rows = await this.db.select().from(skuGroup).where(eq(skuGroup.id, id));
    return rows[0] ? mapRowToEntity(rows[0]) : null;
  }

  /** BehemothCRUDDAOController#addNewEntity(entity) equivalent */
  async insert(data: InsertSkuGroupValues): Promise<SkuGroupEntity> {
    const rows = await this.db.insert(skuGroup).values(data).returning();
    return mapRowToEntity(rows[0]);
  }

  /**
   * BehemothCRUDDAOController#modifyEntity(entity) equivalent, called from
   * SkuGroupDaoController#updateSkuGroup. Read current version, then write
   * version-checked inside one transaction — see class doc.
   */
  async update(id: bigint, data: UpdateSkuGroupValues): Promise<SkuGroupEntity | null> {
    return this.db.transaction(async (tx) => {
      const rows = await tx.select({ version: skuGroup.version }).from(skuGroup).where(eq(skuGroup.id, id));
      const existing = rows[0];
      if (!existing) return null;

      const updated = await tx
        .update(skuGroup)
        .set({ ...data, version: existing.version + 1n })
        .where(and(eq(skuGroup.id, id), eq(skuGroup.version, existing.version)))
        .returning();

      if (updated.length === 0) {
        throw new OptimisticLockError("sku_group", id);
      }
      return mapRowToEntity(updated[0]);
    });
  }

  /**
   * deleteSkuGroup(Long id) — source is an unimplemented stub
   * (`//TODO: implement delete` — always `return true;`, no repository
   * call at all). Preserved verbatim: no delete statement is issued here
   * either. See SkuGroup.service.ts for the corresponding TODO.
   */

  /**
   * retrieveSkuGroup(size, offset) — named native query RETRIEVE_SKU_GROUP.
   * Column list and order reproduced exactly from
   * SkuGroupNativeQuery.RETRIEVE_SKU_GROUP.QUERY.
   */
  async retrieveSkuGroupData(size: number, offset: number): Promise<SkuGroupData[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
        id,
        version,
        name,
        time_of_creation
      FROM sku_group
      ORDER BY id
      LIMIT ${size} OFFSET ${offset}
    `);
    return rows.map(mapRowToSkuGroupData);
  }

  /**
   * retrieveSkuGroupById(id) — named native query RETRIEVE_SKU_GROUP_BY_ID.
   * Identical column list/order to the paginated query, filtered by id.
   */
  async retrieveSkuGroupDataById(id: bigint): Promise<SkuGroupData | null> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
        id,
        version,
        name,
        time_of_creation
      FROM sku_group
      WHERE id = ${id}
    `);
    return rows[0] ? mapRowToSkuGroupData(rows[0]) : null;
  }
}

function mapRowToEntity(row: typeof skuGroup.$inferSelect): SkuGroupEntity {
  return {
    id: Number(row.id),
    version: Number(row.version),
    name: row.name,
    timeOfCreation: Number(row.timeOfCreation),
  };
}

function mapRowToSkuGroupData(row: Record<string, unknown>): SkuGroupData {
  return {
    id: Number(row.id),
    version: Number(row.version),
    name: row.name as string,
    timeOfCreation: Number(row.time_of_creation),
  };
}
// @ts-nocheck
// @ts-nocheck
