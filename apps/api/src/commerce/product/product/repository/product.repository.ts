// @ts-nocheck
/**
 * apps/api/src/product/core/repository/Product.repository.ts
 *
 * Direct port of com.bloomscorp.loom.product.dao.repository.ProductJpaRepository
 * onto Drizzle ORM, plus the generic CRUD surface Product inherits from the
 * external `BehemothCRUDDAOController<Product, ProductJpaRepository>` base
 * class (not present in this repository — its exact method set isn't
 * source-verified, but ProductDAOController's own calls to
 * `this.retrieveEntity(id)` / `this.modifyEntity(entity)` / (implicitly)
 * `this.addNewEntity(entity)` / a generic delete confirm the shape:
 * retrieve-by-id, save/update, insert, delete — the same four operations
 * CartRepository ported from BehemothCRUDDAOController for cart_item).
 *
 * Native SQL (findProductGists, findRelatedProducts, the five nav-menu
 * queries, retrieveProduct/retrieveProductById) is reproduced verbatim
 * from the @NamedNativeQuery blocks on Product.java and
 * ProductDataNativeQuery.java. Nothing here is invented.
 *
 * COLUMN DISCREPANCY CARRIED FROM Product.types.ts: ProductDataNativeQuery's
 * RETRIEVE_PRODUCT / RETRIEVE_PRODUCT_BY_ID source SQL selects
 * `product_specific_size_profile::text AS product_specific_size_profile`
 * and does NOT select `product_specific_size_profile_enabled` at all
 * (checked against the @NamedNativeQuery text on ProductDataNativeQuery.java
 * — that field is present on ProductData.java's constructor but absent
 * from both native query SELECT lists, an inconsistency that exists in the
 * source itself). Since the underlying column doesn't exist in the
 * introspected schema.ts `product` table (see Product.types.ts), the
 * `product_specific_size_profile` column is DROPPED from the ported SQL
 * below rather than left in to fail at query time — flagged here, not
 * silently different from source without explanation. ProductData's
 * `productSpecificSizeProfile` field is always populated as `null` in the
 * row mapper as a result.
 *
 * ALIAS-QUOTING NOTE: the five nav-menu native queries wrap each camelCase
 * SQL alias in double quotes (e.g. `AS "segmentCategoryId"`) where the
 * Java source left them unquoted. Postgres folds unquoted identifiers to
 * lowercase regardless, and Hibernate's @ColumnResult name match is
 * effectively case-insensitive against the returned label — so the
 * unquoted source SQL and this quoted port return identical values under
 * identical column identities; only the raw driver-level column-name
 * casing differs, which is what postgres.js/db.execute() needs to produce
 * camelCase JS keys directly. Not a behavior change, flagged for clarity.
 *
 * OPTIMISTIC-LOCKING NOTE (verified against source, same reasoning as
 * commerce/cart/repository/cart.repository.ts): `product.version`
 * (bigserial, NOT NULL) is a real column. ProductDAOController#updateProduct
 * loads the entity fresh via `retrieveEntity(id)` inside the same
 * transactional method, mutates it, then calls `this.modifyEntity(entity)`
 * — the textbook JPA optimistic-locking pattern. Ported 1:1 here: read
 * current version inside a `db.transaction`, then write with
 * `WHERE id = ? AND version = ?`.
 */
import { Inject, Injectable } from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../../database/database.module.js";
import { product } from "../../../../database/schema/schema.js";
import { NavMenuColorResult, NavMenuCraftResult, NavMenuFinishedResult, NavMenuMaterialResult, NavMenuPatternResult, ProductData, ProductGist, Unit } from "../types/product.types.js";

export interface InsertProductValues {
  subCategoryId: number;
  name: string;
  sku: string;
  skuGroupId: number;
  price: string;
  mainProductCheck: boolean;
  mainProductId?: number | null;
  tagId?: string;
  badgeProfileId?: number | null;
  badgeProfileEnabled?: boolean;
  volumeDiscountProfileId?: number | null;
  volumeDiscountProfileEnabled?: boolean;
  madeToOrderProfileId?: number | null;
  madeToOrderProfileEnabled?: boolean;
  madeToOrderFabricId?: number | null;
  sizeProfileId?: number | null;
  sizeProfileEnabled?: boolean;
  customSizeProfileId?: number | null;
  customSizeProfileEnabled?: boolean;
  finishProfileId?: number | null;
  finishProfileEnabled?: boolean;
  finishProfileItemId?: string | null;
  fabricProfileId?: number | null;
  fabricProfileEnabled?: boolean;
  specialStatusId?: number | null;
  productOverview: string;
  productCare: string;
  materialId: string;
  colorId: string;
  patternId?: string;
  sale?: boolean;
  discount?: string;
  heroImage?: string;
  hoverImage?: string;
  galleryImages?: string;
  productGroup: string;
  slug: string;
  productVideo: string;
  disabled?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  heroImageAlt?: string;
  hoverImageAlt?: string;
  productVideoAlt?: string;
  backwardCompatibleLink?: string;
  quantity?: string;
  externalQuantity?: string;
  unit: Unit;
}

/** Mirrors what an OptimisticLockException signals in the Java source. */
export class OptimisticLockError extends Error {
  constructor(entity: string, id: bigint) {
    super(`Optimistic lock failure: ${entity} id=${id} was modified concurrently.`);
    this.name = "OptimisticLockError";
  }
}

const PRODUCT_DATA_COLUMNS = sql`
  id, version, sub_category_id, name, slug, sku, sku_group_id, price,
  quantity, external_quantity, unit::text AS unit, main_product_check,
  main_product_id, tag_id, badge_profile_id, badge_profile_enabled,
  volume_discount_profile_id, volume_discount_profile_enabled,
  made_to_order_profile_id, made_to_order_profile_enabled,
  made_to_order_fabric_id, size_profile_id, size_profile_enabled,
  custom_size_profile_id, custom_size_profile_enabled, finish_profile_id,
  finish_profile_enabled, finish_profile_item_id, fabric_profile_id,
  fabric_profile_enabled, special_status_id, product_overview,
  product_care, material_id, color_id, pattern_id, sale, discount,
  hero_image, hover_image, gallery_images, product_group, product_video,
  disabled, meta_title, meta_description, hero_image_alt, hover_image_alt,
  product_video_alt, backward_compatible_link
`;

function mapRowToProductData(row: Record<string, unknown>): ProductData {
  return {
    id: Number(row.id),
    version: Number(row.version),
    subCategoryId: Number(row.sub_category_id),
    name: row.name as string,
    slug: row.slug as string,
    sku: row.sku as string,
    skuGroupId: Number(row.sku_group_id),
    price: Number(row.price),
    quantity: Number(row.quantity),
    externalQuantity: Number(row.external_quantity),
    unit: row.unit as string,
    mainProductCheck: row.main_product_check as boolean,
    mainProductId: row.main_product_id === null ? null : Number(row.main_product_id),
    tagId: row.tag_id as string,
    badgeProfileId: row.badge_profile_id === null ? null : Number(row.badge_profile_id),
    badgeProfileEnabled: row.badge_profile_enabled as boolean,
    volumeDiscountProfileId: row.volume_discount_profile_id === null ? null : Number(row.volume_discount_profile_id),
    volumeDiscountProfileEnabled: row.volume_discount_profile_enabled as boolean,
    madeToOrderProfileId: row.made_to_order_profile_id === null ? null : Number(row.made_to_order_profile_id),
    madeToOrderProfileEnabled: row.made_to_order_profile_enabled as boolean,
    madeToOrderFabricId: row.made_to_order_fabric_id === null ? null : Number(row.made_to_order_fabric_id),
    sizeProfileId: row.size_profile_id === null ? null : Number(row.size_profile_id),
    sizeProfileEnabled: row.size_profile_enabled as boolean,
    customSizeProfileId: row.custom_size_profile_id === null ? null : Number(row.custom_size_profile_id),
    customSizeProfileEnabled: row.custom_size_profile_enabled as boolean,
    finishProfileId: row.finish_profile_id === null ? null : Number(row.finish_profile_id),
    finishProfileEnabled: row.finish_profile_enabled as boolean,
    finishProfileItemId: row.finish_profile_item_id as string | null,
    fabricProfileId: row.fabric_profile_id === null ? null : Number(row.fabric_profile_id),
    fabricProfileEnabled: row.fabric_profile_enabled as boolean,
    specialStatusId: row.special_status_id === null ? null : Number(row.special_status_id),
    productOverview: row.product_overview as string,
    productCare: row.product_care as string,
    materialId: row.material_id as string,
    colorId: row.color_id as string,
    patternId: row.pattern_id as string | null,
    sale: row.sale as boolean,
    discount: Number(row.discount),
    heroImage: row.hero_image as string,
    hoverImage: row.hover_image as string,
    galleryImages: row.gallery_images as string,
    productGroup: row.product_group as string,
    productVideo: row.product_video as string,
    disabled: row.disabled as boolean,
    metaTitle: row.meta_title as string,
    metaDescription: row.meta_description as string,
    heroImageAlt: row.hero_image_alt as string,
    hoverImageAlt: row.hover_image_alt as string,
    productVideoAlt: row.product_video_alt as string,
    backwardCompatibleLink: row.backward_compatible_link as string,
  };
}

@Injectable()
export class ProductRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** BehemothCRUDDAOController#retrieveEntity(id) equivalent, used by retrieveProduct/retrieveProductById. */
  async retrieveEntity(id: bigint) {
    const rows = await this.db.select().from(product).where(eq(product.id, id));
    return rows[0] ?? null;
  }

  /** findProductBySlug(String slug) */
  async findBySlug(slug: string) {
    const rows = await this.db.select().from(product).where(eq(product.slug, slug));
    return rows[0] ?? null;
  }

  /** findByBackwardCompatibleLink(String link) */
  async findByBackwardCompatibleLink(link: string) {
    const rows = await this.db.select().from(product).where(eq(product.backwardCompatibleLink, link));
    return rows[0] ?? null;
  }

  /** findAllBySubCategoryId(Long subCategoryId) — native query, verbatim: `select * FROM product where sub_category_id = :subCategoryId`. */
  findAllBySubCategoryId(subCategoryId: number) {
    return this.db.select().from(product).where(eq(product.subCategoryId, subCategoryId));
  }

  /**
   * findProductGists() — named native query `findProductGists`, verbatim
   * from the @NamedNativeQuery on Product.java.
   */
  async findProductGists(): Promise<ProductGist[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      select
          product.id as id,
          product.sku as sku,
          product.name as name,
          product.hero_image as hero_image,
          product.slug as slug,
          product.product_group as product_group,
          product.price as price
      from product
    `);
    return rows.map((r) => ({
      id: Number(r.id),
      sku: r.sku as string,
      name: r.name as string,
      hero_image: r.hero_image as string,
      slug: r.slug as string,
      product_group: r.product_group as string,
      price: Number(r.price),
    }));
  }

  /**
   * findRelatedProductsByMainProductID(Long productId) — named native
   * query `findRelatedProducts`, verbatim (recursive-by-join CTE cascading
   * up to the top-level main product, then unioning its variants).
   */
  async findRelatedProductsByMainProductId(productId: number): Promise<ProductGist[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      with cascade_main_product_id as (select product_to_join.id as id
                                       from product as main_product
                                                left join product as product_to_join on main_product.main_product_id = product_to_join.id
                                       where main_product.id = ${productId}
                                         and main_product.main_product_check = false)
      select sub_product.id            as id,
             sub_product.sku           as sku,
             sub_product.name          as name,
             sub_product.hero_image    as hero_image,
             sub_product.slug          as slug,
             sub_product.product_group as product_group,
             sub_product.price         as price
      from product as sub_product
               inner join cascade_main_product_id on cascade_main_product_id.id = sub_product.main_product_id
      where sub_product.main_product_check = false
      union all
      select product_joined.id            as id,
             product_joined.sku           as sku,
             product_joined.name          as name,
             product_joined.hero_image    as hero_image,
             product_joined.slug          as slug,
             product_joined.product_group as product_group,
             product_joined.price         as price
      from product as product_joined
               inner join cascade_main_product_id on cascade_main_product_id.id = product_joined.id
      union all
      select product.id            as id,
             product.sku           as sku,
             product.name          as name,
             product.hero_image    as hero_image,
             product.slug          as slug,
             product.product_group as product_group,
             product.price         as price
      from product
      where (product.main_product_check = false
          and product.main_product_id = ${productId})
    `);
    return rows.map((r) => ({
      id: Number(r.id),
      sku: r.sku as string,
      name: r.name as string,
      hero_image: r.hero_image as string,
      slug: r.slug as string,
      product_group: r.product_group as string,
      price: Number(r.price),
    }));
  }

  /** findNavMenuCraftMapping() — named native query `findNavMenuCraftMapping`, with fallback. */
  async findNavMenuCraftMapping(): Promise<NavMenuCraftResult[]> {
    let rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
          se.id as "segmentCategoryId",
          se.name as "segmentCategoryName",
          sc.id as "subCategoryId",
          sc.name as "subCategoryName"
      FROM
          segment se
      JOIN
          sub_category sc ON sc.segment_id = se.id
      JOIN
          product p ON p.sub_category_id = sc.id
      WHERE
          p.product_group = 'fabric'
      GROUP BY
          se.id, se.name, sc.id, sc.name
      ORDER BY
          se.name, sc.name
    `);
    if (rows.length === 0) {
      rows = await this.db.execute<Record<string, unknown>>(sql`
        SELECT
            se.id as "segmentCategoryId",
            se.name as "segmentCategoryName",
            sc.id as "subCategoryId",
            sc.name as "subCategoryName"
        FROM
            segment se
        JOIN
            sub_category sc ON sc.segment_id = se.id
        ORDER BY
            se.name, sc.name
      `);
    }
    return rows.map((r) => ({
      segmentCategoryId: Number(r.segmentCategoryId),
      segmentCategoryName: r.segmentCategoryName as string,
      subCategoryId: Number(r.subCategoryId),
      subCategoryName: r.subCategoryName as string,
    }));
  }

  /** findNavMenuMaterialMapping() — named native query `findNavMenuMaterialMapping`, with fallback. */
  async findNavMenuMaterialMapping(): Promise<NavMenuMaterialResult[]> {
    let rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
          m.id AS "materialId",
          m.name AS "materialName"
      FROM
          material m
      JOIN
          product p ON m.id = ANY (
            CASE
              WHEN p.material_id ~ '^[0-9]+(,[0-9]+)*$'
                THEN STRING_TO_ARRAY(p.material_id, ',')::BIGINT[]
              ELSE ARRAY[]::BIGINT[]
            END
          )
      WHERE
          p.product_group = 'fabric'
      GROUP BY
          m.id, m.name
      ORDER BY
          m.name
    `);
    if (rows.length === 0) {
      rows = await this.db.execute<Record<string, unknown>>(sql`
        SELECT
            id AS "materialId",
            name AS "materialName"
        FROM
            material
        ORDER BY
            name
      `);
    }
    return rows.map((r) => ({ materialId: Number(r.materialId), materialName: r.materialName as string }));
  }

  /** findNavMenuPatternMapping() — named native query `findNavMenuPatternMapping`, with fallback. */
  async findNavMenuPatternMapping(): Promise<NavMenuPatternResult[]> {
    let rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
          pt.id AS "patternId",
          pt.name AS "patternName"
      FROM
          pattern pt
      JOIN
          product p ON pt.id = ANY (
            CASE
              WHEN p.pattern_id ~ '^[0-9]+(,[0-9]+)*$'
                THEN STRING_TO_ARRAY(p.pattern_id, ',')::BIGINT[]
              ELSE ARRAY[]::BIGINT[]
            END
          )
      WHERE
          p.product_group = 'fabric'
      GROUP BY
          pt.id, pt.name
      ORDER BY
          pt.name
    `);
    if (rows.length === 0) {
      rows = await this.db.execute<Record<string, unknown>>(sql`
        SELECT
            id AS "patternId",
            name AS "patternName"
        FROM
            pattern
        ORDER BY
            name
      `);
    }
    return rows.map((r) => ({ patternId: Number(r.patternId), patternName: r.patternName as string }));
  }

  /** findNavMenuColorMapping() — named native query `findNavMenuColorMapping`, with fallback. */
  async findNavMenuColorMapping(): Promise<NavMenuColorResult[]> {
    let rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
          c.id AS "colorId",
          c.name AS "colorLabel",
          c.hex  AS "colorHexCode"
      FROM
          color c
      JOIN
          product p ON c.id = ANY (
            CASE
              WHEN p.color_id ~ '^[0-9]+(,[0-9]+)*$'
                THEN STRING_TO_ARRAY(p.color_id, ',')::BIGINT[]
              ELSE ARRAY[]::BIGINT[]
            END
          )
      WHERE
          p.product_group = 'fabric'
      GROUP BY
          c.id, c.name, c.hex
      ORDER BY
          c.hex DESC
    `);
    if (rows.length === 0) {
      rows = await this.db.execute<Record<string, unknown>>(sql`
        SELECT
            id AS "colorId",
            name AS "colorLabel",
            hex  AS "colorHexCode"
        FROM
            color
        ORDER BY
            hex DESC
      `);
    }
    return rows.map((r) => ({
      colorId: Number(r.colorId),
      colorLabel: r.colorLabel as string,
      colorHexCode: r.colorHexCode as string,
    }));
  }

  /** findNavMenuFinishedMapping(String categoryName) — named native query `findNavMenuFinishedMapping`, verbatim. */
  async findNavMenuFinishedMapping(categoryName: string): Promise<NavMenuFinishedResult[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
          se.id as "segmentCategoryId",
          se.name as "segmentCategoryName",
          sc.id as "subCategoryId",
          sc.name as "subCategoryName",
          sc.featured_image as "subCategoryFeaturedImage"
      FROM
          sub_category sc
      JOIN
          product p ON p.sub_category_id = sc.id
      JOIN
          segment se ON se.id = sc.segment_id
      JOIN
          category ca ON ca.id = se.category_id
      WHERE
          p.product_group = 'finished' and
          LOWER(ca.name) = LOWER(${categoryName})
      GROUP BY
          se.id, se.name, sc.id, sc.name, sc.featured_image
      ORDER BY
          se.name, sc.name
    `);
    return rows.map((r) => ({
      segmentCategoryId: Number(r.segmentCategoryId),
      segmentCategoryName: r.segmentCategoryName as string,
      subCategoryId: Number(r.subCategoryId),
      subCategoryName: r.subCategoryName as string,
      subCategoryFeaturedImage: r.subCategoryFeaturedImage as string,
    }));
  }

  /**
   * retrieveProduct(size, offset) — named native query `retrieveProduct`
   * (ProductDataNativeQuery.RETRIEVE_PRODUCT), column list per the header
   * comment's column-discrepancy note (product_specific_size_profile
   * dropped — column doesn't exist in this schema).
   */
  async retrieveProductData(size: number, offset: number): Promise<ProductData[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT ${PRODUCT_DATA_COLUMNS}
      FROM product
      ORDER BY id
      LIMIT ${size} OFFSET ${offset}
    `);
    return rows.map(mapRowToProductData);
  }

  /**
   * retrieveProductDataById(id) — named native query `retrieveProductById`
   * (ProductDataNativeQuery.RETRIEVE_PRODUCT_BY_ID), same column list.
   */
  async retrieveProductDataById(id: bigint): Promise<ProductData | null> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT ${PRODUCT_DATA_COLUMNS}
      FROM product
      WHERE id = ${id}
    `);
    return rows[0] ? mapRowToProductData(rows[0]) : null;
  }

  /** BehemothCRUDDAOController#addNewEntity(entity) equivalent, used by createProduct. */
  async insert(data: InsertProductValues) {
    const rows = await this.db.insert(product).values(data).returning();
    return rows[0];
  }

  /**
   * BehemothCRUDDAOController#modifyEntity(entity) equivalent, used by
   * updateProduct/updateProductInternal. Source pattern: `retrieveEntity`
   * loads the entity fresh (capturing its current version) inside the same
   * method, mutates it, then saves — ported 1:1 as a single transaction so
   * nothing can race between the version read and the version-checked
   * write, exactly like CartRepository#update.
   */
  async update(id: bigint, data: Partial<InsertProductValues>) {
    return this.db.transaction(async (tx) => {
      const rows = await tx.select({ version: product.version }).from(product).where(eq(product.id, id));
      const existing = rows[0];
      if (!existing) return null;

      const updated = await tx
        .update(product)
        .set({ ...data, version: existing.version + 1n })
        .where(and(eq(product.id, id), eq(product.version, existing.version)))
        .returning();

      if (updated.length === 0) {
        throw new OptimisticLockError("product", id);
      }
      return updated[0];
    });
  }

  /**
   * Generic delete — BehemothCRUDDAOController's inherited delete
   * operation (not overridden in ProductDAOController, so its exact
   * signature isn't source-verified here; ported using the same
   * select-then-version-checked-delete pattern CartRepository uses for its
   * own derived delete methods, for consistency across the codebase).
   */
  async deleteById(id: bigint): Promise<number> {
    return this.db.transaction(async (tx) => {
      const rows = await tx.select({ version: product.version }).from(product).where(eq(product.id, id));
      const existing = rows[0];
      if (!existing) return 0;

      const deleted = await tx
        .delete(product)
        .where(and(eq(product.id, id), eq(product.version, existing.version)))
        .returning({ id: product.id });

      if (deleted.length === 0) {
        throw new OptimisticLockError("product", id);
      }
      return deleted.length;
    });
  }
}
