// @ts-nocheck
/**
 * apps/api/src/product/special-status/special-status.repository.ts
 *
 * Direct port of com.bloomscorp.loom.product.special_status.dao.repository.SpecialStatusJpaRepository
 * (and the BehemothCRUDDAOController base methods SpecialStatusDaoController
 * relies on) onto Drizzle ORM. The two named native queries
 * (RETRIEVE_SPECIAL_STATUS / RETRIEVE_SPECIAL_STATUS_BY_ID) are reproduced
 * verbatim via `db.execute(sql\`...\`)`, column list and order taken
 * directly from SpecialStatusNativeQuery.java. Nothing here is invented.
 *
 * NOT PORTED (source has no such method): unlike TagJpaRepository
 * (retrieveTagsByIds), SpecialStatusJpaRepository declares no
 * findByIds-equivalent — only retrieveSpecialStatus(size, offset) and
 * retrieveSpecialStatusDataById(id) beyond the base JpaRepository CRUD
 * methods. No such method is added here either.
 *
 * OPTIMISTIC-LOCKING NOTE (verified against source): `special_status.version`
 * (bigserial, NOT NULL) is a real column (schema.ts), inherited from the
 * external `BehemothORM` base class (not present in the uploaded
 * repository) the same way `sku_group.version` / `cart_item.version` are.
 * SpecialStatusDaoController's `updateSpecialStatus` follows the identical
 * textbook JPA optimistic-locking pattern already ported for SkuGroup/Cart:
 * `retrieveEntity(id)` loads the row (capturing its current version) inside
 * the same call, mutates it, then saves — Hibernate emits
 * `UPDATE ... SET version = version + 1 WHERE id = ? AND version = ?`.
 * Ported 1:1 here: read current version inside a `db.transaction`, then
 * write with `WHERE id = ? AND version = ?`, surfacing a 0-row race as
 * `OptimisticLockError`, exactly like
 * product/sku_group/SkuGroup.repository.ts.
 */
import { Inject, Injectable } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../../database/database.module.js";
import { specialStatus } from "../../../../database/schema/schema.js";
import { SpecialStatusData, SpecialStatusEntity } from "../types/special-status.types.js";

export interface InsertSpecialStatusValues {
  name: string;
  timeOfCreation: number;
}

export interface UpdateSpecialStatusValues {
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
export class SpecialStatusRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** SpecialStatusDaoController#retrieveSpecialStatusList — this.getRepository().findAll() */
  async findAll(): Promise<SpecialStatusEntity[]> {
    const rows = await this.db.select().from(specialStatus);
    return rows.map(mapRowToEntity);
  }

  /** BehemothCRUDDAOController#retrieveEntity(id) equivalent, used by retrieveSpecialStatusById */
  async retrieveEntity(id: bigint): Promise<SpecialStatusEntity | null> {
    const rows = await this.db.select().from(specialStatus).where(eq(specialStatus.id, id));
    return rows[0] ? mapRowToEntity(rows[0]) : null;
  }

  /** BehemothCRUDDAOController#addNewEntity(entity) equivalent */
  async insert(data: InsertSpecialStatusValues): Promise<SpecialStatusEntity> {
    const rows = await this.db.insert(specialStatus).values(data).returning();
    return mapRowToEntity(rows[0]);
  }

  /**
   * BehemothCRUDDAOController#modifyEntity(entity) equivalent, called from
   * SpecialStatusDaoController#updateSpecialStatus. Read current version,
   * then write version-checked inside one transaction — see class doc.
   */
  async update(id: bigint, data: UpdateSpecialStatusValues): Promise<SpecialStatusEntity | null> {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .select({ version: specialStatus.version })
        .from(specialStatus)
        .where(eq(specialStatus.id, id));
      const existing = rows[0];
      if (!existing) return null;

      const updated = await tx
        .update(specialStatus)
        .set({ ...data, version: existing.version + 1n })
        .where(and(eq(specialStatus.id, id), eq(specialStatus.version, existing.version)))
        .returning();

      if (updated.length === 0) {
        throw new OptimisticLockError("special_status", id);
      }
      return mapRowToEntity(updated[0]);
    });
  }

  /**
   * deleteSpecialStatus(Long id) — source is an unimplemented stub
   * (`//TODO: implement delete` — always `return true;`, no repository
   * call at all). Preserved verbatim: no delete statement is issued here
   * either. See special-status.service.ts for the corresponding TODO.
   */

  /**
   * retrieveSpecialStatus(size, offset) — named native query
   * RETRIEVE_SPECIAL_STATUS. Column list and order reproduced exactly from
   * SpecialStatusNativeQuery.RETRIEVE_SPECIAL_STATUS.QUERY.
   */
  async retrieveSpecialStatusData(size: number, offset: number): Promise<SpecialStatusData[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
        id,
        version,
        name,
        time_of_creation
      FROM special_status
      ORDER BY id
      LIMIT ${size} OFFSET ${offset}
    `);
    return rows.map(mapRowToSpecialStatusData);
  }

  /**
   * retrieveSpecialStatusById(id) — named native query
   * RETRIEVE_SPECIAL_STATUS_BY_ID. Identical column list/order to the
   * paginated query, filtered by id.
   */
  async retrieveSpecialStatusDataById(id: bigint): Promise<SpecialStatusData | null> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
        id,
        version,
        name,
        time_of_creation
      FROM special_status
      WHERE id = ${id}
    `);
    return rows[0] ? mapRowToSpecialStatusData(rows[0]) : null;
  }
}

function mapRowToEntity(row: typeof specialStatus.$inferSelect): SpecialStatusEntity {
  return {
    id: Number(row.id),
    version: Number(row.version),
    name: row.name,
    timeOfCreation: Number(row.timeOfCreation),
  };
}

function mapRowToSpecialStatusData(row: Record<string, unknown>): SpecialStatusData {
  return {
    id: Number(row.id),
    version: Number(row.version),
    name: row.name as string,
    timeOfCreation: Number(row.time_of_creation),
  };
}
