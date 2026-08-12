// @ts-nocheck
/**
 * apps/api/src/commerce/product/product-preview/repository/product-preview.repository.ts
 *
 * Direct port of com.bloomscorp.loom.product.dao.repository.ProductPreviewJpaRepository
 * onto Drizzle ORM against the `product` table (ProductPreview is a JPA
 * projection over the same table as Product — see ProductContract.TABLE).
 * Every method below corresponds 1:1 to a source repository method; native
 * SQL (the color/material array filters, the sub_category/segment/category
 * name joins, and the combined facet filter) is reproduced verbatim via
 * `db.execute(sql\`...\`)`, including the Postgres `string_to_array(...)`
 * and `UNNEST(...) = ANY(...)` patterns. Nothing here is invented.
 *
 * The two named native queries that return ProductSearchResult
 * (findProductSearchResultBySKU, findProductSearchResultsByColorId, etc.)
 * are defined via @NamedNativeQuery on the ProductPreview entity in
 * source, not shown in the uploaded repository slice. Their SQL bodies are
 * NOT source-verified here — only their existence and calling signature
 * are (from ProductPreviewJpaRepository's @Query(nativeQuery = true, name = "...")
 * references). Flagged inline; do not treat as a public contract until the
 * @NamedNativeQuery definitions are located and diffed against this file.
 */
import { Inject, Injectable } from "@nestjs/common";
import { eq, ilike, sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../../database/database.module.js";
import { product } from "../../../../database/schema/schema.js";
import { ProductPreviewFilterArgs, ProductSearchResult } from "../types/product-preview.types.js";

@Injectable()
export class ProductPreviewRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** findAllByDisabledFalse(Pageable pageable) */
  findAllActive(limit: number, offset: number) {
    return this.db.select().from(product).where(eq(product.disabled, false)).limit(limit).offset(offset);
  }

  /** findProductPreviewByNameIgnoreCase(String name) */
  async findByNameIgnoreCase(name: string) {
    const rows = await this.db.select().from(product).where(ilike(product.name, name));
    return rows[0] ?? null;
  }

  /** findProductPreviewBySkuIgnoreCase(String sku) */
  async findBySkuIgnoreCase(sku: string) {
    const rows = await this.db.select().from(product).where(ilike(product.sku, sku));
    return rows[0] ?? null;
  }

  /**
   * findProductSearchResultBySkuIgnoreCase(String sku) — named native query
   * `findProductSearchResultBySKU`. SQL body not present in uploaded source
   * (see file header); reconstructed as a minimal, source-consistent
   * projection (id/name/slug/sku/price/hero_image) matching
   * ProductSearchResult's documented fields. Confirm against the real
   * @NamedNativeQuery before relying on this in production.
   */
  async findSearchResultBySkuIgnoreCase(sku: string): Promise<ProductSearchResult | null> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT id, name, slug, sku, price, hero_image
      FROM product
      WHERE lower(sku) = lower(${sku})
    `);
    return rows[0] ? mapRowToSearchResult(rows[0]) : null;
  }

  /** findProductPreviewsByColorId(long colorId) */
  findByColorId(colorId: number) {
    return this.db.execute(sql`
      SELECT * FROM product
      WHERE ${colorId} = ANY(cast(string_to_array(product.color_id, ',') as bigint[]))
    `);
  }

  /** findProductSearchResultsByColorId(long colorId) — see named-native-query caveat above. */
  async findSearchResultsByColorId(colorId: number): Promise<ProductSearchResult[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT id, name, slug, sku, price, hero_image
      FROM product
      WHERE ${colorId} = ANY(cast(string_to_array(product.color_id, ',') as bigint[]))
    `);
    return rows.map(mapRowToSearchResult);
  }

  /** findProductPreviewsByMaterialId(long materialId) */
  findByMaterialId(materialId: number) {
    return this.db.execute(sql`
      SELECT * FROM product
      WHERE ${materialId} = ANY(cast(string_to_array(product.material_id, ',') as bigint[]))
    `);
  }

  /** findProductSearchResultsByMaterialId(long materialId) — see named-native-query caveat above. */
  async findSearchResultsByMaterialId(materialId: number): Promise<ProductSearchResult[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT id, name, slug, sku, price, hero_image
      FROM product
      WHERE ${materialId} = ANY(cast(string_to_array(product.material_id, ',') as bigint[]))
    `);
    return rows.map(mapRowToSearchResult);
  }

  /** findProductSearchResultsByPatternId(long patternId) — see named-native-query caveat above. */
  async findSearchResultsByPatternId(patternId: number): Promise<ProductSearchResult[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT id, name, slug, sku, price, hero_image
      FROM product
      WHERE ${patternId} = ANY(cast(string_to_array(product.pattern_id, ',') as bigint[]))
    `);
    return rows.map(mapRowToSearchResult);
  }

  /** findProductPreviewsBySubCategoryName(String name) */
  findBySubCategoryName(name: string) {
    return this.db.execute(sql`
      SELECT product.* FROM product
      LEFT JOIN sub_category ON product.sub_category_id = sub_category.id
      WHERE lower(sub_category.name) LIKE lower(concat('%', ${name}, '%'))
    `);
  }

  /** findProductSearchResultsBySubCategoryName(String name) — see named-native-query caveat above. */
  async findSearchResultsBySubCategoryName(name: string): Promise<ProductSearchResult[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT product.id, product.name, product.slug, product.sku, product.price, product.hero_image
      FROM product
      LEFT JOIN sub_category ON product.sub_category_id = sub_category.id
      WHERE lower(sub_category.name) LIKE lower(concat('%', ${name}, '%'))
    `);
    return rows.map(mapRowToSearchResult);
  }

  /** findProductPreviewBySegmentName(String name) */
  findBySegmentName(name: string) {
    return this.db.execute(sql`
      SELECT product.* FROM product
      JOIN sub_category ON product.sub_category_id = sub_category.id
      JOIN segment ON sub_category.segment_id = segment.id
      WHERE lower(segment.name) LIKE lower(concat('%', ${name}, '%'))
    `);
  }

  /** findProductSearchResultsBySegmentName(String name) — see named-native-query caveat above. */
  async findSearchResultsBySegmentName(name: string): Promise<ProductSearchResult[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT product.id, product.name, product.slug, product.sku, product.price, product.hero_image
      FROM product
      JOIN sub_category ON product.sub_category_id = sub_category.id
      JOIN segment ON sub_category.segment_id = segment.id
      WHERE lower(segment.name) LIKE lower(concat('%', ${name}, '%'))
    `);
    return rows.map(mapRowToSearchResult);
  }

  /** findProductPreviewsByCategoryName(String name) */
  findByCategoryName(name: string) {
    return this.db.execute(sql`
      SELECT product.* FROM product
      JOIN sub_category ON product.sub_category_id = sub_category.id
      JOIN segment ON sub_category.segment_id = segment.id
      JOIN category ON segment.category_id = category.id
      WHERE lower(category.name) LIKE lower(concat('%', ${name}, '%'))
    `);
  }

  /** findProductSearchResultsByCategoryName(String name) — see named-native-query caveat above. */
  async findSearchResultsByCategoryName(name: string): Promise<ProductSearchResult[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT product.id, product.name, product.slug, product.sku, product.price, product.hero_image
      FROM product
      JOIN sub_category ON product.sub_category_id = sub_category.id
      JOIN segment ON sub_category.segment_id = segment.id
      JOIN category ON segment.category_id = category.id
      WHERE lower(category.name) LIKE lower(concat('%', ${name}, '%'))
    `);
    return rows.map(mapRowToSearchResult);
  }

  /**
   * findProductPreviewsByAllFilterIds(long[] colorIds, long[] materialIds,
   * long[] subCategoryIds, long[] segmentIds, long[] categoryIds) — complex
   * faceted-search query, reproduced verbatim including the EXISTS/UNNEST
   * pattern for color/material and the direct `= ANY(...)` for the
   * category hierarchy ids.
   */
  findByAllFilterIds(args: ProductPreviewFilterArgs) {
    const { colorIds, materialIds, subCategoryIds, segmentIds, categoryIds } = args;
    const colorIdsParam = colorIds.length > 0 ? colorIds : [-1];
    const materialIdsParam = materialIds.length > 0 ? materialIds : [-1];
    const categoryIdsParam = categoryIds.length > 0 ? categoryIds : [-1];
    const segmentIdsParam = segmentIds.length > 0 ? segmentIds : [-1];
    const subCategoryIdsParam = subCategoryIds.length > 0 ? subCategoryIds : [-1];

    return this.db.execute(sql`
      SELECT product.*
      FROM product
      JOIN sub_category ON product.sub_category_id = sub_category.id
      JOIN segment ON sub_category.segment_id = segment.id
      JOIN category ON segment.category_id = category.id
      WHERE
        EXISTS (
          SELECT 1
          FROM unnest(cast(string_to_array(product.color_id, ',') as int[])) AS color_id
          WHERE color_id = ANY(${colorIdsParam})
        )
        AND EXISTS (
          SELECT 1
          FROM unnest(cast(string_to_array(product.material_id, ',') as int[])) AS material_id
          WHERE material_id = ANY(${materialIdsParam})
        )
        AND category.id = ANY(${categoryIdsParam})
        AND segment.id = ANY(${segmentIdsParam})
        AND sub_category.id = ANY(${subCategoryIdsParam})
    `);
  }

  /** retrieveEntity(id) equivalent — BehemothCRUDDAOController pattern used elsewhere in this codebase. */
  async findById(id: bigint) {
    const rows = await this.db.select().from(product).where(eq(product.id, id));
    return rows[0] ?? null;
  }
}

function mapRowToSearchResult(row: Record<string, unknown>): ProductSearchResult {
  return {
    id: Number(row.id),
    name: row.name as string,
    slug: row.slug as string,
    sku: row.sku as string,
    price: Number(row.price),
    heroImage: (row.hero_image as string) ?? "",
  };
}
