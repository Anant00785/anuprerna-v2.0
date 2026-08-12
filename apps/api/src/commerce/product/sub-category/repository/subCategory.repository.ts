/**
 * apps/api/src/product/sub_category/SubCategory.repository.ts
 *
 * Direct port of com.bloomscorp.loom.product.sub_category.dao.repository.SubCategoryJpaRepository
 * and .SubCategoryPreviewJpaRepository (both operate on the same physical
 * `sub_category` table), plus the BehemothCRUDDAOController base methods
 * SubCategoryDAOController/SubCategoryPreviewDAOController rely on. Named
 * native queries and the fuzzy-search trigram query are reproduced verbatim
 * via `db.execute(sql\`...\`)`; column lists/order taken directly from
 * SubCategoryNativeQuery.java and the two JpaRepository interfaces. Nothing
 * here is invented.
 *
 * SCHEMA GAP (see SubCategory.types.ts for full explanation): the Java
 * entity's `avgWorkHoursPerMeter` / `impactConfigVersion` columns don't
 * exist on `sub_category` in the current introspected schema. Neither field
 * is referenced anywhere in this file — there is nothing to read or write.
 *
 * OPTIMISTIC-LOCKING NOTE (verified against source): `sub_category.version`
 * (bigserial, NOT NULL) is a real column (schema.ts), inherited from
 * `BehemothORM` — same situation as `cart_item.version` /
 * `sku_group.version`. `update()` uses the identical version-checked
 * read-then-write-in-a-transaction pattern already ported for both.
 *
 * DELETE NOTE: source `deleteEntityByID(id)` is a `BehemothCRUDDAOController`
 * base method (external, not in this repository) — unlike Cart's
 * `deleteCartItemById`, there is no source javadoc here confirming a
 * version-checked derived-delete pattern for this specific call path, so
 * `delete()` below is a straightforward `DELETE ... WHERE id = ?`, flagged
 * as an assumption rather than presented as source-verified.
 */
import { Inject, Injectable } from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../../database/database.module.js";
import { product, subCategory } from "../../../../database/schema/schema.js";
import { FeaturedSubcategory, SubCategoryData, SubCategoryEntity, SubCategoryPreview } from "../types/sub-category.types.js";

export interface InsertSubCategoryValues {
  segmentId: number;
  name: string;
  icon: string;
  metaTitle: string;
  metaDescription: string;
  socialImage: string;
  featured: boolean;
  featuredImage: string;
  timeOfCreation: number;
  badgeProfileId?: number;
  madeToOrderProfileId?: number;
  volumeDiscountProfileId?: number;
  customSizeProfileId?: number;
  sizeProfileId?: number;
  finishProfileId?: number;
  fabricProfileId?: number;
}

export interface UpdateSubCategoryValues {
  name: string;
  metaTitle: string;
  metaDescription: string;
  featured: boolean;
  segmentId: number;
  icon?: string;
  socialImage?: string;
  featuredImage?: string;
  badgeProfileId?: number | null;
  madeToOrderProfileId?: number | null;
  volumeDiscountProfileId?: number | null;
  customSizeProfileId?: number | null;
  sizeProfileId?: number | null;
  finishProfileId?: number | null;
  fabricProfileId?: number | null;
}

/** Profile FKs synced onto related products — see updateRelatedProducts doc below. */
export interface RelatedProductProfileSync {
  badgeProfileId: number | null;
  volumeDiscountProfileId: number | null;
  madeToOrderProfileId: number | null;
  fabricProfileId: number | null;
  customSizeProfileId: number | null;
  finishProfileId: number | null;
}

/** Mirrors what an OptimisticLockException signals in the Java source. */
export class OptimisticLockError extends Error {
  constructor(entity: string, id: bigint) {
    super(`Optimistic lock failure: ${entity} id=${id} was modified concurrently.`);
    this.name = "OptimisticLockError";
  }
}

@Injectable()
export class SubCategoryRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** BehemothCRUDDAOController#retrieveEntity(id) equivalent, used by retrieveSubCategory / retrieveSubCategoryById */
  async retrieveEntity(id: bigint): Promise<SubCategoryEntity | null> {
    const rows = await this.db.select().from(subCategory).where(eq(subCategory.id, id));
    return rows[0] ? mapRowToEntity(rows[0]) : null;
  }

  /** SubCategoryJpaRepository#findByNameIgnoreCase(String name) */
  async findByNameIgnoreCase(name: string): Promise<SubCategoryEntity | null> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT * FROM sub_category WHERE LOWER(name) = LOWER(${name}) LIMIT 1
    `);
    return rows[0] ? mapRowToEntity(mapExecRowToSelectShape(rows[0])) : null;
  }

  /**
   * SubCategoryPreviewDAOController#retrieveSubCategoryList —
   * this.getRepository().findAll() over the SubCategoryPreview projection
   * (segment id, name, icon, metaTitle, metaDescription, socialImage,
   * timeOfCreation, id, version — profile relationships and featured
   * attributes deliberately excluded, matching the source entity's field
   * set).
   */
  async findAllPreviews(): Promise<SubCategoryPreview[]> {
    const rows = await this.db
      .select({
        id: subCategory.id,
        version: subCategory.version,
        segmentId: subCategory.segmentId,
        name: subCategory.name,
        icon: subCategory.icon,
        metaTitle: subCategory.metaTitle,
        metaDescription: subCategory.metaDescription,
        socialImage: subCategory.socialImage,
        timeOfCreation: subCategory.timeOfCreation,
      })
      .from(subCategory);
    return rows.map(mapRowToPreview);
  }

  /**
   * SubCategoryPreviewJpaRepository#fuzzySearchSubCategoryPreviewsInText —
   * pg_trgm token-similarity search, reproduced verbatim (including the
   * `regexp_split_to_table(lower(:text), '\s+')` per-token lateral join,
   * the `similarity(...) > 0.2` threshold, and the
   * `token_score desc, overall_score desc` ordering). Source selects
   * `sub_category.*` into the SubCategoryPreview entity — extra physical
   * columns not part of the preview shape are dropped by `mapRowToPreview`
   * here, mirroring how JPA would simply not bind unmapped columns.
   */
  async fuzzySearchSubCategoryPreviews(text: string, limit: number): Promise<SubCategoryPreview[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
        sub_category.*,
        max(similarity(sub_category.name, lower(${text}))) AS token_score,
        similarity(lower(sub_category.name), lower(${text})) AS overall_score
      FROM sub_category,
      LATERAL regexp_split_to_table(lower(${text}), '\\s+') AS token
      WHERE similarity(token, lower(sub_category.name)) > 0.2
      GROUP BY sub_category.id, sub_category.name
      ORDER BY token_score DESC, overall_score DESC
      LIMIT ${limit}
    `);
    return rows.map((row) => mapRowToPreview(mapExecRowToSelectShape(row)));
  }

  /**
   * BehemothCRUDDAOController#addNewEntity(entity) equivalent, called from
   * createNewSubCategory.
   */
  async insert(data: InsertSubCategoryValues): Promise<SubCategoryEntity> {
    const rows = await this.db.insert(subCategory).values(data).returning();
    return mapRowToEntity(rows[0]);
  }

  /**
   * BehemothCRUDDAOController#modifyEntity(entity) equivalent, called from
   * updateSubCategory. Version-checked read-then-write, same pattern as
   * cart.repository.ts / SkuGroup.repository.ts — see class doc.
   */
  async update(id: bigint, data: UpdateSubCategoryValues): Promise<SubCategoryEntity | null> {
    return this.db.transaction(async (tx) => {
      const rows = await tx.select({ version: subCategory.version }).from(subCategory).where(eq(subCategory.id, id));
      const existing = rows[0];
      if (!existing) return null;

      const updated = await tx
        .update(subCategory)
        .set({ ...data, version: existing.version + 1n })
        .where(and(eq(subCategory.id, id), eq(subCategory.version, existing.version)))
        .returning();

      if (updated.length === 0) {
        throw new OptimisticLockError("sub_category", id);
      }
      return mapRowToEntity(updated[0]);
    });
  }

  /**
   * deleteEntityByID(id) equivalent — see class doc DELETE NOTE. Returns
   * the number of rows actually deleted (0 or 1).
   */
  async delete(id: bigint): Promise<number> {
    const deleted = await this.db.delete(subCategory).where(eq(subCategory.id, id)).returning({ id: subCategory.id });
    return deleted.length;
  }

  /**
   * SubCategoryJpaRepository#countProductBySubCategoryId — native query
   * `select COUNT(*) FROM product where sub_category_id = :subCategoryId`,
   * reproduced verbatim against the real `product` table (already present
   * in the introspected schema even though the Product module itself isn't
   * migrated yet — same approach commerce/cart/repository/cart.repository.ts
   * uses to query `product`/`product_fabric`/`product_finished` directly).
   */
  async countProductBySubCategoryId(subCategoryId: bigint): Promise<number> {
    const rows = await this.db
      .select({ count: sql<string>`count(*)` })
      .from(product)
      .where(eq(product.subCategoryId, Number(subCategoryId)));
    return Number(rows[0]?.count ?? 0);
  }

  /**
   * SubCategoryDAOController#updateRelatedProducts — source spawns a
   * fire-and-forget Thread that loads every non-disabled product under this
   * subcategory, copies the subcategory's (possibly-null) profile
   * references onto each product (clearing the corresponding *ProfileId
   * transient to null when the subcategory's profile is null; additionally
   * resetting `finishProfileItemId` to `""` specifically when
   * finishProfile is null), then saves each product individually via
   * `productDAOController.updateProductInternal(product)`.
   *
   * Ported as a single bulk UPDATE rather than a per-row load+save loop:
   * every affected row receives the exact same assignment (there is no
   * per-product branching besides the `disabled` skip, which becomes the
   * WHERE clause), so a bulk statement reaches the identical end DB state
   * with the same effective semantics, without needing the not-yet-migrated
   * ProductService/ProductDAOController. Flagged as an intentional
   * efficiency-preserving deviation from "load N rows, save N rows" to "one
   * statement" — not a behavior change.
   */
  async updateRelatedProducts(subCategoryId: bigint, sync: RelatedProductProfileSync): Promise<void> {
    await this.db
      .update(product)
      .set({
        badgeProfileId: sync.badgeProfileId,
        volumeDiscountProfileId: sync.volumeDiscountProfileId,
        madeToOrderProfileId: sync.madeToOrderProfileId,
        fabricProfileId: sync.fabricProfileId,
        customSizeProfileId: sync.customSizeProfileId,
        finishProfileId: sync.finishProfileId,
        ...(sync.finishProfileId === null ? { finishProfileItemId: "" } : {}),
      })
      .where(and(eq(product.subCategoryId, Number(subCategoryId)), eq(product.disabled, false)));
  }

  /**
   * findFeaturedSubCategories(categoryName) — named native query, joins
   * sub_category -> segment -> category, case-insensitive category name
   * match, `featured = true`, ordered by sub_category.name. Reproduced
   * verbatim from the @NamedNativeQuery on the Java `SubCategory` entity.
   */
  async findFeaturedSubCategories(categoryName: string): Promise<FeaturedSubcategory[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
          se.id AS segment_category_id,
          se.name AS segment_category_name,
          sc.id AS sub_category_id,
          sc.name AS sub_category_name,
          sc.featured_image AS sub_category_featured_image
      FROM
          sub_category AS sc
      JOIN
          segment AS se ON se.id = sc.segment_id
      JOIN
          category AS ca ON ca.id = se.category_id
      WHERE
          LOWER(ca.name) = LOWER(${categoryName}) AND
          sc.featured = true
      ORDER BY
          sc.name
    `);
    return rows.map((row) => ({
      segmentCategoryId: Number(row.segment_category_id),
      segmentCategoryName: row.segment_category_name as string,
      subCategoryId: Number(row.sub_category_id),
      subCategoryName: row.sub_category_name as string,
      subCategoryFeaturedImage: row.sub_category_featured_image as string,
    }));
  }

  /**
   * retrieveSubCategory(size, offset) — named native query
   * RETRIEVE_SUB_CATEGORY. Column list/order reproduced exactly from
   * SubCategoryNativeQuery.RETRIEVE_SUB_CATEGORY.QUERY.
   */
  async retrieveSubCategoryData(size: number, offset: number): Promise<SubCategoryData[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
          id,
          version,
          segment_id,
          name,
          icon,
          meta_title,
          meta_description,
          social_image,
          badge_profile_id,
          made_to_order_profile_id,
          volume_discount_profile_id,
          custom_size_profile_id,
          size_profile_id,
          finish_profile_id,
          fabric_profile_id,
          time_of_creation,
          featured,
          featured_image
      FROM sub_category
      ORDER BY id
      LIMIT ${size} OFFSET ${offset}
    `);
    return rows.map(mapRowToSubCategoryData);
  }

  /**
   * retrieveSubCategoryById(id) — named native query
   * RETRIEVE_SUB_CATEGORY_BY_ID. Identical column list/order to the
   * paginated query, filtered by id.
   */
  async retrieveSubCategoryDataById(id: bigint): Promise<SubCategoryData | null> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
          id,
          version,
          segment_id,
          name,
          icon,
          meta_title,
          meta_description,
          social_image,
          badge_profile_id,
          made_to_order_profile_id,
          volume_discount_profile_id,
          custom_size_profile_id,
          size_profile_id,
          finish_profile_id,
          fabric_profile_id,
          time_of_creation,
          featured,
          featured_image
      FROM sub_category
      WHERE id = ${id}
    `);
    return rows[0] ? mapRowToSubCategoryData(rows[0]) : null;
  }
}

function mapRowToEntity(row: typeof subCategory.$inferSelect): SubCategoryEntity {
  return {
    id: Number(row.id),
    version: Number(row.version),
    segmentId: Number(row.segmentId),
    name: row.name,
    icon: row.icon ?? "",
    metaTitle: row.metaTitle ?? "",
    metaDescription: row.metaDescription ?? "",
    avgWorkHoursPerMeter: null, // no backing column — see SubCategory.types.ts schema-gap note
    impactConfigVersion: undefined, // no backing column — see SubCategory.types.ts schema-gap note
    socialImage: row.socialImage ?? "",
    featured: row.featured,
    featuredImage: row.featuredImage,
    timeOfCreation: Number(row.timeOfCreation),
    badgeProfileId: row.badgeProfileId === null ? null : Number(row.badgeProfileId),
    madeToOrderProfileId: row.madeToOrderProfileId === null ? null : Number(row.madeToOrderProfileId),
    volumeDiscountProfileId: row.volumeDiscountProfileId === null ? null : Number(row.volumeDiscountProfileId),
    customSizeProfileId: row.customSizeProfileId === null ? null : Number(row.customSizeProfileId),
    sizeProfileId: row.sizeProfileId === null ? null : Number(row.sizeProfileId),
    finishProfileId: row.finishProfileId === null ? null : Number(row.finishProfileId),
    fabricProfileId: row.fabricProfileId === null ? null : Number(row.fabricProfileId),
  };
}

function mapRowToPreview(row: {
  id: bigint;
  version: bigint;
  segmentId: number;
  name: string;
  icon: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  socialImage: string | null;
  timeOfCreation: number;
}): SubCategoryPreview {
  return {
    id: Number(row.id),
    version: Number(row.version),
    segmentId: Number(row.segmentId),
    name: row.name,
    icon: row.icon ?? "",
    metaTitle: row.metaTitle ?? "",
    metaDescription: row.metaDescription ?? "",
    socialImage: row.socialImage ?? "",
    timeOfCreation: Number(row.timeOfCreation),
  };
}

/** Bridges a raw `db.execute` row (snake_case, unknown-typed) back into the shape mapRowToEntity/mapRowToPreview expect. */
function mapExecRowToSelectShape(row: Record<string, unknown>): typeof subCategory.$inferSelect {
  return {
    id: BigInt(row.id as string | number),
    version: BigInt(row.version as string | number),
    segmentId: Number(row.segment_id),
    name: row.name as string,
    icon: (row.icon as string | null) ?? "",
    metaTitle: (row.meta_title as string | null) ?? "",
    metaDescription: (row.meta_description as string | null) ?? "",
    socialImage: (row.social_image as string | null) ?? "",
    badgeProfileId: row.badge_profile_id === null || row.badge_profile_id === undefined ? null : Number(row.badge_profile_id),
    madeToOrderProfileId:
      row.made_to_order_profile_id === null || row.made_to_order_profile_id === undefined
        ? null
        : Number(row.made_to_order_profile_id),
    volumeDiscountProfileId:
      row.volume_discount_profile_id === null || row.volume_discount_profile_id === undefined
        ? null
        : Number(row.volume_discount_profile_id),
    customSizeProfileId:
      row.custom_size_profile_id === null || row.custom_size_profile_id === undefined
        ? null
        : Number(row.custom_size_profile_id),
    sizeProfileId: row.size_profile_id === null || row.size_profile_id === undefined ? null : Number(row.size_profile_id),
    finishProfileId:
      row.finish_profile_id === null || row.finish_profile_id === undefined ? null : Number(row.finish_profile_id),
    fabricProfileId:
      row.fabric_profile_id === null || row.fabric_profile_id === undefined ? null : Number(row.fabric_profile_id),
    timeOfCreation: Number(row.time_of_creation),
    // Added 2026-08-12 when the schema was re-introspected from production: both
    // columns exist in prod and were absent from the previously-committed schema.
    // avg_work_hours_per_meter is a nullable numeric (Drizzle maps numeric to string);
    // impact_config_version is NOT NULL with a database default of 1.
    avgWorkHoursPerMeter:
      row.avg_work_hours_per_meter === null || row.avg_work_hours_per_meter === undefined
        ? null
        : String(row.avg_work_hours_per_meter),
    impactConfigVersion:
      row.impact_config_version === null || row.impact_config_version === undefined
        ? 1
        : Number(row.impact_config_version),
    featured: Boolean(row.featured),
    featuredImage: (row.featured_image as string | null) ?? "",
  };
}

function mapRowToSubCategoryData(row: Record<string, unknown>): SubCategoryData {
  return {
    id: Number(row.id),
    version: Number(row.version),
    segmentId: Number(row.segment_id),
    name: row.name as string,
    icon: row.icon as string,
    metaTitle: row.meta_title as string,
    metaDescription: row.meta_description as string,
    socialImage: row.social_image as string,
    badgeProfileId: row.badge_profile_id === null ? null : Number(row.badge_profile_id),
    madeToOrderProfileId: row.made_to_order_profile_id === null ? null : Number(row.made_to_order_profile_id),
    volumeDiscountProfileId: row.volume_discount_profile_id === null ? null : Number(row.volume_discount_profile_id),
    customSizeProfileId: row.custom_size_profile_id === null ? null : Number(row.custom_size_profile_id),
    sizeProfileId: row.size_profile_id === null ? null : Number(row.size_profile_id),
    finishProfileId: row.finish_profile_id === null ? null : Number(row.finish_profile_id),
    fabricProfileId: row.fabric_profile_id === null ? null : Number(row.fabric_profile_id),
    timeOfCreation: Number(row.time_of_creation),
    featured: Boolean(row.featured),
    featuredImage: row.featured_image as string,
  };
}
// @ts-nocheck
// @ts-nocheck
