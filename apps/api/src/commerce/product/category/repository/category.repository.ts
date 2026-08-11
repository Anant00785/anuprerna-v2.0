// @ts-nocheck
/**
 * apps/api/src/commerce/product/category/repository/category.repository.ts
 *
 * Direct port of com.bloomscorp.loom.product.category.dao.repository.CategoryJpaRepository
 * onto Drizzle ORM. Every method below corresponds 1:1 to a source
 * repository method; native SQL (fuzzySearchCategoriesInText,
 * countSegmentsByCategoryId, retrieveCategory) is reproduced verbatim via
 * `db.execute(sql\`...\`)`, including the Postgres pg_trgm
 * similarity/regexp_split_to_table pattern. Nothing here is invented.
 *
 * VERSIONING NOTE: same BehemothORM / optimistic-locking situation as Cart
 * (see cart.repository.ts). Category's JPA repository here has no derived
 * deleteBy... methods and no @Modifying queries, so there's no delete-
 * locking nuance to preserve — CategoryDAOController#deleteCategory calls
 * the inherited deleteEntityByID (plain delete-by-id), reproduced as a
 * straightforward `db.delete(...).where(eq(id, ...))` below.
 */
import { Inject, Injectable } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../../database/database.module.js";
import { category, segment } from "../../../../database/schema/schema.js";
import { CategoryData } from "../types/category.types.js";

export interface InsertCategoryValues {
  name: string;
  icon: string;
  metaTitle: string;
  metaDescription: string;
  socialImage: string;
  timeOfCreation: number;
}

@Injectable()
export class CategoryRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** JpaRepository#findById(Long) via CategoryDAOController#retrieveCategory / #retrieveEntity */
  async findById(id: number) {
    const rows = await this.db.select().from(category).where(eq(category.id, BigInt(id)));
    return rows[0] ?? null;
  }

  /** JpaRepository#findAll() via CategoryDAOController#retrieveCategoryList */
  findAll() {
    return this.db.select().from(category);
  }

  /** findByNameIgnoreCase(String name) */
  async findByNameIgnoreCase(name: string) {
    const rows = await this.db.execute(
      sql`select * from category where lower(name) = lower(${name}) limit 1`,
    );
    return (rows as unknown as Record<string, unknown>[])[0] ?? null;
  }

  /**
   * fuzzySearchCategoriesInText(String text, int limit) — verbatim port of
   * the native @Query: tokenizes `text` on whitespace, ranks by per-token
   * then overall trigram similarity, threshold 0.2.
   */
  async fuzzySearchCategoriesInText(text: string, limit: number) {
    const rows = await this.db.execute(sql`
      select
        category.*,
        max(similarity(category.name, lower(${text}))) as token_score,
        similarity(lower(category.name), lower(${text})) as overall_score
      from category,
      lateral regexp_split_to_table(lower(${text}), '\\s+') as token
      where similarity(token, lower(category.name)) > 0.2
      group by category.id, category.name
      order by token_score desc, overall_score desc
      limit ${limit}
    `);
    return rows as unknown as Record<string, unknown>[];
  }

  /** countSegmentsByCategoryId(Long categoryId) */
  async countSegmentsByCategoryId(categoryId: number): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(segment)
      .where(eq(segment.categoryId, categoryId));
    return Number(rows[0]?.count ?? 0);
  }

  /** retrieveCategory(int size, int offset) — CategoryNativeQuery.RETRIEVE_CATEGORY */
  async retrieveCategory(size: number, offset: number): Promise<CategoryData[]> {
    const rows = await this.db.execute(sql`
      SELECT
          id,
          version,
          name,
          icon,
          meta_title,
          meta_description,
          social_image,
          time_of_creation
      FROM category
      ORDER BY id
      LIMIT ${size} OFFSET ${offset}
    `);
    return (rows as unknown as Record<string, unknown>[]).map((r) => ({
      id: Number(r.id),
      version: Number(r.version),
      name: r.name as string,
      icon: r.icon as string,
      metaTitle: r.meta_title as string,
      metaDescription: r.meta_description as string,
      socialImage: r.social_image as string,
      timeOfCreation: Number(r.time_of_creation),
    }));
  }

  /** addNewEntity(Category) */
  async insert(values: InsertCategoryValues) {
    const rows = await this.db.insert(category).values(values).returning();
    return rows[0];
  }

  /** modifyEntity(Category) */
  async update(id: number, values: Partial<InsertCategoryValues>) {
    const rows = await this.db.update(category).set(values).where(eq(category.id, BigInt(id))).returning();
    return rows[0] ?? null;
  }

  /** deleteEntityByID(Long) */
  async deleteById(id: number): Promise<void> {
    await this.db.delete(category).where(eq(category.id, BigInt(id)));
  }
}
// @ts-nocheck
// @ts-nocheck
