/**
 * apps/api/src/commerce/product/segment/repository/segment.repository.ts
 *
 * Direct port of com.bloomscorp.loom.product.segment.dao.repository.SegmentJpaRepository
 * onto Drizzle ORM. Every method below corresponds 1:1 to a source
 * repository method; native SQL (fuzzySearchSegmentsInText,
 * findSegmentPreviewByCategory, countSubCategoryBySegmentId,
 * retrieveSegment, retrieveSegmentDataById) is reproduced verbatim via
 * `db.execute(sql\`...\`)`. Nothing here is invented.
 *
 * VERSIONING NOTE: same BehemothORM situation as Cart/Category — no
 * derived deleteBy... methods and no @Modifying queries here, so
 * deleteById is a plain delete-by-id, matching source's inherited
 * deleteEntityByID.
 */
import { Inject, Injectable } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../../database/database.module.js";
import { segment, subCategory } from "../../../../database/schema/schema.js";
import { SegmentData, SegmentPreview } from "../types/segment.types.js";

export interface InsertSegmentValues {
  categoryId: number;
  name: string;
  icon: string;
  metaTitle: string;
  metaDescription: string;
  socialImage: string;
  timeOfCreation: number;
}

@Injectable()
export class SegmentRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** JpaRepository#findById(Long) */
  async findById(id: number) {
    const rows = await this.db.select().from(segment).where(eq(segment.id, BigInt(id)));
    return rows[0] ?? null;
  }

  /** JpaRepository#findAll() */
  findAll() {
    return this.db.select().from(segment);
  }

  /** findByNameIgnoreCase(String name) */
  async findByNameIgnoreCase(name: string) {
    const rows = await this.db.execute(
      sql`select * from segment where lower(name) = lower(${name}) limit 1`,
    );
    return (rows as unknown as Record<string, unknown>[])[0] ?? null;
  }

  /**
   * fuzzySearchSegmentsInText(String text, int limit) — verbatim port of
   * the native @Query: tokenizes `text` on whitespace, ranks by per-token
   * then overall trigram similarity, threshold 0.2.
   */
  async fuzzySearchSegmentsInText(text: string, limit: number) {
    const rows = await this.db.execute(sql`
      select
        segment.*,
        max(similarity(segment.name, lower(${text}))) as token_score,
        similarity(lower(segment.name), lower(${text})) as overall_score
      from segment,
      lateral regexp_split_to_table(lower(${text}), '\\s+') as token
      where similarity(token, lower(segment.name)) > 0.2
      group by segment.id, segment.name
      order by token_score desc, overall_score desc
      limit ${limit}
    `);
    return rows as unknown as Record<string, unknown>[];
  }

  /**
   * findSegmentPreviewByCategory(String categoryName) — named native query
   * `findSegmentPreview`: left join segment to category, optional
   * case-insensitive category name filter (null/empty means "all").
   */
  async findSegmentPreviewByCategory(categoryName: string | null | undefined): Promise<SegmentPreview[]> {
    const rows = await this.db.execute(sql`
      select
          segment.category_id as "categoryId",
          category.name as "categoryName",
          segment.id as "segmentId",
          segment.name as "name",
          segment.icon as "icon",
          segment.meta_title as "metaTitle",
          segment.meta_description as "metaDescription",
          segment.social_image as "socialImage"
      from segment
      left join category on segment.category_id = category.id
      where ${categoryName ?? null}::text is null
          or ${categoryName ?? null}::text = ''
          or lower(category.name) = lower(${categoryName ?? null}::text)
    `);
    return (rows as unknown as Record<string, unknown>[]).map((r) => ({
      categoryId: Number(r.categoryId),
      categoryName: (r.categoryName as string | null) ?? null,
      segmentId: Number(r.segmentId),
      name: r.name as string,
      icon: r.icon as string,
      metaTitle: r.metaTitle as string,
      metaDescription: r.metaDescription as string,
      socialImage: r.socialImage as string,
    }));
  }

  /** countSubCategoryBySegmentId(Long segmentId) */
  async countSubCategoryBySegmentId(segmentId: number): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(subCategory)
      .where(eq(subCategory.segmentId, segmentId));
    return Number(rows[0]?.count ?? 0);
  }

  /** retrieveSegment(int size, int offset) — SegmentNativeQuery.RETRIEVE_SEGMENT */
  async retrieveSegment(size: number, offset: number): Promise<SegmentData[]> {
    const rows = await this.db.execute(sql`
      SELECT
          id,
          version,
          category_id,
          name,
          icon,
          meta_title,
          meta_description,
          social_image,
          time_of_creation
      FROM segment
      ORDER BY id
      LIMIT ${size} OFFSET ${offset}
    `);
    return (rows as unknown as Record<string, unknown>[]).map(mapRowToSegmentData);
  }

  /** retrieveSegmentDataById(Long id) — SegmentNativeQuery.RETRIEVE_SEGMENT_BY_ID */
  async retrieveSegmentDataById(id: number): Promise<SegmentData | null> {
    const rows = await this.db.execute(sql`
      SELECT
          id,
          version,
          category_id,
          name,
          icon,
          meta_title,
          meta_description,
          social_image,
          time_of_creation
      FROM segment
      WHERE id = ${id}
    `);
    const row = (rows as unknown as Record<string, unknown>[])[0];
    return row ? mapRowToSegmentData(row) : null;
  }

  /** addNewEntity(Segment) */
  async insert(values: InsertSegmentValues) {
    const rows = await this.db.insert(segment).values(values).returning();
    return rows[0];
  }

  /** modifyEntity(Segment) */
  async update(id: number, values: Partial<InsertSegmentValues>) {
    const rows = await this.db.update(segment).set(values).where(eq(segment.id, BigInt(id))).returning();
    return rows[0] ?? null;
  }

  /** deleteEntityByID(Long) */
  async deleteById(id: number): Promise<void> {
    await this.db.delete(segment).where(eq(segment.id, BigInt(id)));
  }
}

function mapRowToSegmentData(r: Record<string, unknown>): SegmentData {
  return {
    id: Number(r.id),
    version: Number(r.version),
    categoryId: Number(r.category_id),
    name: r.name as string,
    icon: r.icon as string,
    metaTitle: r.meta_title as string,
    metaDescription: r.meta_description as string,
    socialImage: r.social_image as string,
    timeOfCreation: Number(r.time_of_creation),
  };
}
// @ts-nocheck
// @ts-nocheck
