// @ts-nocheck
/**
 * apps/api/src/catalog/product/tag/repository/tag.repository.ts
 *
 * Direct port of com.bloomscorp.loom.product.tag.dao.repository.TagJpaRepository
 * and com.bloomscorp.loom.product.tag.dao.controller.TagDAOController onto
 * Drizzle ORM. Native queries (RETRIEVE_TAG, RETRIEVE_TAG_BY_ID) are
 * reproduced verbatim via `db.execute(sql\`...\`)`.
 *
 * OPTIMISTIC-LOCKING NOTE: `tag.version` is `bigserial NOT NULL` in the
 * introspected schema (database/schema/schema.ts), same shape as
 * `cart_item.version`. `Tag extends BehemothORM` (external base class, not
 * present in the uploaded repository) so its `@Version` annotation can't be
 * directly inspected here, but the identical column shape plus the same
 * `BehemothCRUDDAOController#modifyEntity` base method Cart's
 * `CartItemDAOController` also extends is enough to apply the same,
 * already source-verified pattern used in commerce/cart/repository/cart.repository.ts:
 * read current version inside a transaction, then write with
 * `WHERE id = ? AND version = ?`, surfacing a 0-row result as
 * OptimisticLockError.
 */
import { Inject, Injectable } from "@nestjs/common";
import { eq, and, inArray, sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../../database/database.module.js";
import { tag } from "../../../../database/schema/schema.js";
import { TagData } from "../types/tag.types.js";

export interface InsertTagValues {
  name: string;
  timeOfCreation: number;
}

/** Mirrors what an OptimisticLockException signals in the Java source. */
export class OptimisticLockError extends Error {
  constructor(entity: string, id: bigint) {
    super(`Optimistic lock failure: ${entity} id=${id} was modified concurrently.`);
    this.name = "OptimisticLockError";
  }
}

@Injectable()
export class TagRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** TagDAOController#retrieveTagList -> this.getRepository().findAll() */
  findAll() {
    return this.db.select().from(tag);
  }

  /** TagDAOController#retrieveTagsByIds(List<Long> ids) -> findAllById(ids) */
  findByIds(ids: bigint[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return this.db.select().from(tag).where(inArray(tag.id, ids));
  }

  /** BehemothCRUDDAOController#retrieveEntity(id), used by retrieveTagById */
  async findById(id: bigint) {
    const rows = await this.db.select().from(tag).where(eq(tag.id, id));
    return rows[0] ?? null;
  }

  /** BehemothCRUDDAOController#addNewEntity(entity), used by createTag */
  async insert(data: InsertTagValues) {
    const rows = await this.db.insert(tag).values(data).returning();
    return rows[0];
  }

  /**
   * BehemothCRUDDAOController#modifyEntity(entity), used by updateTag.
   * Source loads the entity (capturing its current version), mutates
   * `name`, then saves — Hibernate emits
   * `UPDATE ... SET version = version + 1 WHERE id = ? AND version = ?`.
   * Ported 1:1: read + write inside one transaction so nothing can race.
   */
  async update(id: bigint, data: Partial<InsertTagValues>) {
    return this.db.transaction(async (tx) => {
      const rows = await tx.select({ version: tag.version }).from(tag).where(eq(tag.id, id));
      const existing = rows[0];
      if (!existing) return null;

      const updated = await tx
        .update(tag)
        .set({ ...data, version: existing.version + 1n })
        .where(and(eq(tag.id, id), eq(tag.version, existing.version)))
        .returning();

      if (updated.length === 0) {
        throw new OptimisticLockError("tag", id);
      }
      return updated[0];
    });
  }

  /**
   * TagNativeQuery.RETRIEVE_TAG, reproduced verbatim:
   *   SELECT id, version, name, time_of_creation FROM tag ORDER BY id LIMIT :size OFFSET :offset
   */
  async retrieveTagData(page: number, size: number): Promise<TagData[]> {
    const offset = page * size;
    const rows = await this.db.execute<{
      id: string | number | bigint;
      version: string | number | bigint;
      name: string;
      time_of_creation: number;
    }>(sql`
      SELECT id, version, name, time_of_creation
      FROM tag
      ORDER BY id
      LIMIT ${size} OFFSET ${offset}
    `);
    return rows.map(mapRowToTagData);
  }

  /**
   * TagNativeQuery.RETRIEVE_TAG_BY_ID, reproduced verbatim:
   *   SELECT id, version, name, time_of_creation FROM tag WHERE id = :id
   */
  async retrieveTagDataById(id: bigint): Promise<TagData | null> {
    const rows = await this.db.execute<{
      id: string | number | bigint;
      version: string | number | bigint;
      name: string;
      time_of_creation: number;
    }>(sql`
      SELECT id, version, name, time_of_creation
      FROM tag
      WHERE id = ${id}
    `);
    return rows[0] ? mapRowToTagData(rows[0]) : null;
  }
}

function mapRowToTagData(row: {
  id: string | number | bigint;
  version: string | number | bigint;
  name: string;
  time_of_creation: number;
}): TagData {
  return {
    id: BigInt(row.id),
    version: BigInt(row.version),
    name: row.name,
    timeOfCreation: Number(row.time_of_creation),
  };
}
// @ts-nocheck
// @ts-nocheck
