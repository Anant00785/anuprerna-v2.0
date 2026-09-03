/**
 * apps/api/src/commerce/product/fabric-product/fabric-product.repository.ts
 *
 * Direct port of com.bloomscorp.loom.product.dao.repository.FabricProductJpaRepository
 * onto Drizzle ORM, plus the generic CRUD surface FabricProduct inherits
 * from `BehemothCRUDDAOController<FabricProduct, FabricProductJpaRepository>`
 * (same not-present-in-repo base class as Product Core's own
 * ProductRepository — see that file's header for the reasoning). Native
 * SQL (findFabricOverview, retrieveFabricProductData, and the four
 * FIND_FABRIC_FILTER_PREVIEW* queries) is reproduced verbatim from the
 * @NamedNativeQuery blocks on FabricProductNativeQuery.java and
 * FabricProductDataNativeQuery.java. Nothing here is invented.
 *
 * OPTIMISTIC-LOCKING NOTE: `product_fabric.version` (bigserial, NOT NULL)
 * is a real column, and FabricProductDAOController#updateFabricProduct
 * loads the entity fresh via `retrieveEntity(id)` inside the same
 * @Transactional method, mutates it, then calls `this.modifyEntity(...)`
 * — the same pattern CartRepository and Product Core's ProductRepository
 * both port as read-then-version-checked-write inside `db.transaction`.
 * Reused identically here.
 */
import { Inject, Injectable } from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../../database/database.module.js";
import { productFabric } from "../../../../database/schema/schema.js";
import { FabricFilterPreview, FabricFilterPreviewFilters, FabricOverview, FabricProductData } from "../types/fabric-product.types.js";

export interface InsertFabricProductValues {
  productId: number;
  gsm: number;
  addToSwatch?: boolean;
  width: string;
}

/** Mirrors what an OptimisticLockException signals in the Java source. */
export class OptimisticLockError extends Error {
  constructor(entity: string, id: bigint) {
    super(`Optimistic lock failure: ${entity} id=${id} was modified concurrently.`);
    this.name = "OptimisticLockError";
  }
}

function mapFabricFilterPreviewRow(r: Record<string, unknown>): FabricFilterPreview {
  return {
    id: Number(r.id),
    gsm: Number(r.gsm),
    product_id: Number(r.product_id),
    sku: r.sku as string,
    name: r.name as string,
    price: Number(r.price),
    hero_image: r.hero_image as string,
    hover_image: r.hover_image as string,
    slug: r.slug as string,
    unit: r.unit as string,
    material: r.material as string,
    color: r.color as string,
    pattern: r.pattern as string,
    quantity: Number(r.quantity),
    is_main_product: r.is_main_product as boolean,
    segment_category: r.segment_category as string | null,
    sub_category: r.sub_category as string | null,
    category: r.category as string | null,
    special_status: r.special_status as string | null,
    volume_discount: r.volume_discount === null ? null : Number(r.volume_discount),
    volume_discount_minimum_order_quantity:
      r.volume_discount_minimum_order_quantity === null ? null : Number(r.volume_discount_minimum_order_quantity),
    consumed_fabric: r.consumed_fabric === null ? null : Number(r.consumed_fabric),
    minimum_order_quantity: r.minimum_order_quantity === null ? null : Number(r.minimum_order_quantity),
    finish_profile_item_list: r.finish_profile_item_list ?? null,
    max_discount_product_price: r.max_discount_product_price === null ? null : Number(r.max_discount_product_price),
    max_discount_product_discount:
      r.max_discount_product_discount === null ? null : Number(r.max_discount_product_discount),
    made_to_order_fabric_quantity:
      r.made_to_order_fabric_quantity === null ? null : Number(r.made_to_order_fabric_quantity),
    external_quantity: Number(r.external_quantity),
    total_quantity: Number(r.total_quantity),
    product_group: r.product_group as string,
  };
}

/**
 * The four FIND_FABRIC_FILTER_PREVIEW* queries share this exact CTE
 * prelude + SELECT column list verbatim (only the WHERE/ORDER/LIMIT tail
 * differs) — factored out once here to avoid pasting it four times, not a
 * behavior change (each caller still gets the identical SQL text).
 */
const FABRIC_FILTER_PREVIEW_CTE_AND_SELECT = sql`
  with
  max_discount_item as (
      select
          distinct on (profile_id) profile_id, discount, minimum_order_quantity
      from volume_discount_profile_item
      order by profile_id, discount desc
  ),
  finish_profile_items as (
      select
          product.id as product_id,
          jsonb_agg(
              jsonb_build_object(
                  'finish_profile_item_id',
                  finish_profile_item.id,
                  'finish_profile_item_price',
                  finish_profile_item.price
              )
          ) as finish_profile_item_list
      from product
      join lateral
          unnest(string_to_array(product.finish_profile_item_id, ',')) as selected_finish_profile_item_id
          on true
      join finish_profile_item
          on finish_profile_item.id = cast(selected_finish_profile_item_id as bigint)
      group by product.id
  ),
  max_discount_product as (
      select
          product.id,
          product.price,
          max_discount_item.discount
      from product
      left join max_discount_item
          on max_discount_item.profile_id = product.volume_discount_profile_id
  )
  select
      product_fabric.id as id,
      product_fabric.product_id as product_id,
      product_fabric.gsm as gsm,
      product.sku as sku,
      product.name as name,
      product.price as price,
      product.product_group as product_group,
      product.hero_image as hero_image,
      product.hover_image as hover_image,
      product.slug as slug,
      product.unit as unit,
      product.material_id as material,
      product.color_id as color,
      product.pattern_id as pattern,
      product.quantity as quantity,
      product.main_product_check as is_main_product,
      segment.name as segment_category,
      sub_category.name as sub_category,
      category.name as category,
      special_status.name as special_status,
      max_discount_item.discount as volume_discount,
      max_discount_item.minimum_order_quantity as volume_discount_minimum_order_quantity,
      made_to_order_profile.consumed_fabric as consumed_fabric,
      made_to_order_profile.minimum_order_quantity as minimum_order_quantity,
      finish_profile_items.finish_profile_item_list as finish_profile_item_list,
      max_discount_product.price as max_discount_product_price,
      max_discount_product.discount as max_discount_product_discount,
      mto_fabric.quantity + mto_fabric.external_quantity as made_to_order_fabric_quantity,
      product.external_quantity as external_quantity,
      product.quantity + product.external_quantity as total_quantity
  from product_fabric
  left join product on product_fabric.product_id = product.id
  left join product mto_fabric on product.made_to_order_fabric_id = mto_fabric.id
  left join sub_category on product.sub_category_id = sub_category.id
  left join segment on sub_category.segment_id = segment.id
  left join category on segment.category_id = category.id
  left join special_status on product.special_status_id = special_status.id
  left join max_discount_item on product.volume_discount_profile_id = max_discount_item.profile_id
  left join made_to_order_profile on product.made_to_order_profile_id = made_to_order_profile.id
  left join finish_profile_items on product_fabric.product_id = finish_profile_items.product_id
  left join max_discount_product on product_fabric.product_id = max_discount_product.id
`;

@Injectable()
export class FabricProductRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** BehemothCRUDDAOController#retrieveEntity(id) equivalent. */
  async retrieveEntity(id: bigint) {
    const rows = await this.db.select().from(productFabric).where(eq(productFabric.id, id));
    return rows[0] ?? null;
  }

  /** findFabricProductByProduct(Product product) */
  async findByProductId(productId: number) {
    const rows = await this.db.select().from(productFabric).where(eq(productFabric.productId, productId));
    return rows[0] ?? null;
  }

  /** BehemothCRUDDAOController#addNewEntity(entity) equivalent, used by createFabricProduct. */
  async insert(data: InsertFabricProductValues) {
    const rows = await this.db.insert(productFabric).values(data).returning();
    return rows[0];
  }

  /**
   * BehemothCRUDDAOController#modifyEntity(entity) equivalent, used by
   * updateFabricProduct/disableFabricProduct's `this.modifyEntity(fabricProduct)`
   * call. Same read-then-version-checked-write transaction pattern as
   * CartRepository#update / Product Core's ProductRepository#update.
   */
  async update(id: bigint, data: Partial<InsertFabricProductValues>) {
    return this.db.transaction(async (tx) => {
      const rows = await tx.select({ version: productFabric.version }).from(productFabric).where(eq(productFabric.id, id));
      const existing = rows[0];
      if (!existing) return null;

      const updated = await tx
        .update(productFabric)
        .set({ ...data, version: existing.version + 1n })
        .where(and(eq(productFabric.id, id), eq(productFabric.version, existing.version)))
        .returning();

      if (updated.length === 0) {
        throw new OptimisticLockError("product_fabric", id);
      }
      return updated[0];
    });
  }

  /** Generic delete — inherited BehemothCRUDDAOController delete, not overridden in source; same pattern as Product Core's own deleteById. */
  async deleteById(id: bigint): Promise<number> {
    return this.db.transaction(async (tx) => {
      const rows = await tx.select({ version: productFabric.version }).from(productFabric).where(eq(productFabric.id, id));
      const existing = rows[0];
      if (!existing) return 0;

      const deleted = await tx
        .delete(productFabric)
        .where(and(eq(productFabric.id, id), eq(productFabric.version, existing.version)))
        .returning({ id: productFabric.id });

      if (deleted.length === 0) {
        throw new OptimisticLockError("product_fabric", id);
      }
      return deleted.length;
    });
  }

  /** findFabricOverviews() — named native query `findFabricOverview`, verbatim. */
  async findFabricOverviews(): Promise<FabricOverview[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      select product_fabric.id                                  as id,
             product_fabric.gsm                                 as gsm,
             product.id                                         as product_id,
             product.sku                                        as sku,
             product.name                                       as name,
             product.price                                      as price,
             product.hero_image                                 as hero_image,
             product.hover_image                                as hover_image,
             product.slug                                       as slug,
             product.unit                                       as unit,
             product.material_id                                as material,
             product.color_id                                   as color,
             product.pattern_id                                 as pattern,
             product.quantity                                   as quantity,
             segment.name                                       as segment_category,
             segment.id                                         as segment_category_id,
             sub_category.name                                  as sub_category,
             sub_category.id                                    as sub_category_id,
             special_status.name                                as special_status,
             product.external_quantity                          as external_quantity,
             product.quantity + product.external_quantity       as total_quantity,
             product.disabled                                   as disabled,
             sku_group.name                                     as sku_group,
             sku_group.id                                       as sku_group_id,
             category.id                                        as category_id,
             category.name                                      as category
      from product_fabric
               left join product on product_fabric.product_id = product.id
               left join sub_category on product.sub_category_id = sub_category.id
               left join segment on sub_category.segment_id = segment.id
               left join category on segment.category_id = category.id
               left join special_status on product.special_status_id = special_status.id
               left join sku_group on product.sku_group_id = sku_group.id
      order by product_fabric.id desc
    `);
    return rows.map((r) => ({
      id: Number(r.id),
      gsm: Number(r.gsm),
      product_id: Number(r.product_id),
      sku: r.sku as string,
      name: r.name as string,
      price: Number(r.price),
      hero_image: r.hero_image as string,
      hover_image: r.hover_image as string,
      slug: r.slug as string,
      unit: r.unit as string,
      material: r.material as string,
      color: r.color as string,
      pattern: r.pattern as string,
      quantity: Number(r.quantity),
      segment_category: r.segment_category as string | null,
      segment_category_id: r.segment_category_id === null ? null : Number(r.segment_category_id),
      sub_category: r.sub_category as string | null,
      sub_category_id: r.sub_category_id === null ? null : Number(r.sub_category_id),
      special_status: r.special_status as string | null,
      external_quantity: Number(r.external_quantity),
      total_quantity: Number(r.total_quantity),
      disabled: r.disabled as boolean,
      sku_group: r.sku_group as string | null,
      sku_group_id: r.sku_group_id === null ? null : Number(r.sku_group_id),
      category_id: r.category_id === null ? null : Number(r.category_id),
      category: r.category as string | null,
    }));
  }

  /**
   * retrieveFabricProductData(size, offset) — named native query
   * `retrieveFabricProductData` (FabricProductDataNativeQuery.RETRIEVE_FABRIC_PRODUCT_DATA), verbatim.
   */
  async retrieveFabricProductData(size: number, offset: number): Promise<FabricProductData[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
          id,
          version,
          product_id,
          gsm,
          add_to_swatch,
          width
      FROM product_fabric
      ORDER BY id
      LIMIT ${size} OFFSET ${offset}
    `);
    return rows.map((r) => ({
      id: Number(r.id),
      version: Number(r.version),
      productId: Number(r.product_id),
      gsm: Number(r.gsm),
      addToSwatch: r.add_to_swatch as boolean,
      width: r.width as string,
    }));
  }

  /** findFabricFilterPreview(categoryName, segmentCategoryName) — named native query `findFabricFilterPreview`, verbatim. */
  async findFabricFilterPreview(categoryName: string | null, segmentCategoryName: string | null): Promise<FabricFilterPreview[]> {
    const cat = categoryName ?? null;
    const seg = segmentCategoryName ?? null;
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      ${FABRIC_FILTER_PREVIEW_CTE_AND_SELECT}
      where product.disabled=false
      and (${cat}::text is null or ${cat}::text = '' or lower(category.name) = lower(${cat}::text))
      and (${seg}::text is null or ${seg}::text = '' or lower(segment.name) = lower(${seg}::text))
      order by product_fabric.id desc
    `);
    return rows.map(mapFabricFilterPreviewRow);
  }

  /** findFabricFilterPreviewPage(categoryName, segmentCategoryName, limit, offset) — named native query `findFabricFilterPreviewPage`, verbatim. */
  async findFabricFilterPreviewPage(
    categoryName: string | null,
    segmentCategoryName: string | null,
    limit: number,
    offset: number,
  ): Promise<FabricFilterPreview[]> {
    const cat = categoryName ?? null;
    const seg = segmentCategoryName ?? null;
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      ${FABRIC_FILTER_PREVIEW_CTE_AND_SELECT}
      where product.disabled=false
      and (${cat}::text is null or ${cat}::text = '' or lower(category.name) = lower(${cat}::text))
      and (${seg}::text is null or ${seg}::text = '' or lower(segment.name) = lower(${seg}::text))
      order by product_fabric.id desc
      LIMIT ${limit} OFFSET ${offset}
    `);
    return rows.map(mapFabricFilterPreviewRow);
  }

  /**
   * findFabricFilterPreviewByIDs(ids) — named native query
   * `findFabricFilterPreviewByIDs`, verbatim, EXCEPT: source selects the
   * literal `'' as category` (its own comment: "required for pojo mapping
   * only") instead of joining `category` at all — no `category` join
   * exists in this one query's FROM clause in source. Reproduced exactly
   * as written (category always `""`), not silently "fixed" to match the
   * other three queries' real category join.
   */
  async findFabricFilterPreviewByIds(ids: number[]): Promise<FabricFilterPreview[]> {
    if (ids.length === 0) return [];
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      with
      max_discount_item as (
          select
              distinct on (profile_id) profile_id, discount, minimum_order_quantity
          from volume_discount_profile_item
          order by profile_id, discount desc
      ),
      finish_profile_items as (
          select
              product.id as product_id,
              jsonb_agg(
                  jsonb_build_object(
                      'finish_profile_item_id',
                      finish_profile_item.id,
                      'finish_profile_item_price',
                      finish_profile_item.price
                  )
              ) as finish_profile_item_list
          from product
          join lateral
              unnest(string_to_array(product.finish_profile_item_id, ',')) as selected_finish_profile_item_id
              on true
          join finish_profile_item
              on finish_profile_item.id = cast(selected_finish_profile_item_id as bigint)
          group by product.id
      ),
      max_discount_product as (
          select
              product.id,
              product.price,
              max_discount_item.discount
          from product
          left join max_discount_item
              on max_discount_item.profile_id = product.volume_discount_profile_id
      )
      select
          product_fabric.id as id,
          product_fabric.product_id as product_id,
          product_fabric.gsm as gsm,
          product.sku as sku,
          product.name as name,
          product.price as price,
          product.product_group as product_group,
          product.hero_image as hero_image,
          product.hover_image as hover_image,
          product.slug as slug,
          product.unit as unit,
          product.material_id as material,
          product.color_id as color,
          product.pattern_id as pattern,
          product.quantity as quantity,
          product.main_product_check as is_main_product,
          segment.name as segment_category,
          sub_category.name as sub_category,
          '' as category,
          special_status.name as special_status,
          max_discount_item.discount as volume_discount,
          max_discount_item.minimum_order_quantity as volume_discount_minimum_order_quantity,
          made_to_order_profile.consumed_fabric as consumed_fabric,
          made_to_order_profile.minimum_order_quantity as minimum_order_quantity,
          finish_profile_items.finish_profile_item_list as finish_profile_item_list,
          max_discount_product.price as max_discount_product_price,
          max_discount_product.discount as max_discount_product_discount,
          mto_fabric.quantity + mto_fabric.external_quantity as made_to_order_fabric_quantity,
          product.external_quantity as external_quantity,
          product.quantity + product.external_quantity as total_quantity
      from product_fabric
      left join product on product_fabric.product_id = product.id
      left join product mto_fabric on product.made_to_order_fabric_id = mto_fabric.id
      left join sub_category on product.sub_category_id = sub_category.id
      left join segment on sub_category.segment_id = segment.id
      left join special_status on product.special_status_id = special_status.id
      left join max_discount_item on product.volume_discount_profile_id = max_discount_item.profile_id
      left join made_to_order_profile on product.made_to_order_profile_id = made_to_order_profile.id
      left join finish_profile_items on product_fabric.product_id = finish_profile_items.product_id
      left join max_discount_product on product_fabric.product_id = max_discount_product.id
      where product.disabled=false
      and
      product_fabric.id in (${sql.join(ids, sql`, `)})
      order by product_fabric.id desc
    `);
    return rows.map(mapFabricFilterPreviewRow);
  }

  /** findFabricFilterPreviewFiltered(...) — named native query `findFabricFilterPreviewFiltered`, verbatim. */
  async findFabricFilterPreviewFiltered(filters: FabricFilterPreviewFilters): Promise<FabricFilterPreview[]> {
    const col = filters.colors ?? null;
    const mat = filters.materials ?? null;
    const pat = filters.patterns ?? null;
    const minPrice = filters.minPrice ?? null;
    const maxPrice = filters.maxPrice ?? null;
    const minGSM = filters.minGSM ?? null;
    const maxGSM = filters.maxGSM ?? null;
    const segs = filters.segments ?? null;
    const subCats = filters.subCategories ?? null;
    const limit = filters.limit ?? 20;
    const offset = filters.offset ?? 0;

    const rows = await this.db.execute<Record<string, unknown>>(sql`
      ${FABRIC_FILTER_PREVIEW_CTE_AND_SELECT}
      where product.disabled = false
      and (
          ${col}::text is null or ${col}::text = '' or exists (
              select 1
              from color
              where lower(color.name) = any(
                  array(select lower(trim(c)) from unnest(string_to_array(${col}::text, ',')) as c)
              )
              and (
                case when product.color_id ~ '^[0-9]+(,[0-9]+)*$'
                  then color.id = any(string_to_array(product.color_id, ',')::bigint[])
                else false
                end
              )
          )
      )
      and (
          ${mat}::text is null or ${mat}::text = '' or exists (
              select 1
              from material
              where lower(material.name) = any(
                  array(select lower(trim(m)) from unnest(string_to_array(${mat}::text, ',')) as m)
              )
              and (
                case when product.material_id ~ '^[0-9]+(,[0-9]+)*$'
                  then material.id = any(string_to_array(product.material_id, ',')::bigint[])
                else false
                end
              )
          )
      )
      and (
          ${pat}::text is null or ${pat}::text = '' or exists (
              select 1
              from pattern
              where lower(pattern.name) = any(
                  array(select lower(trim(p)) from unnest(string_to_array(${pat}::text, ',')) as p)
              )
              and (
                case when product.pattern_id ~ '^[0-9]+(,[0-9]+)*$'
                  then pattern.id = any(string_to_array(product.pattern_id, ',')::bigint[])
                else false
                end
              )
          )
      )
      and (${minPrice}::numeric is null or product.price >= ${minPrice})
      and (${maxPrice}::numeric is null or product.price <= ${maxPrice})
      and (${minGSM}::integer is null or product_fabric.gsm >= ${minGSM})
      and (${maxGSM}::integer is null or product_fabric.gsm <= ${maxGSM})
      and (
          ((${segs}::text is null or ${segs}::text = '') and (${subCats}::text is null or ${subCats}::text = ''))
          or
          (${segs}::text is not null and ${segs}::text != '' and sub_category.segment_id in (
              select id from segment
              where lower(segment.name) = any(
                  array(select lower(trim(sg)) from unnest(string_to_array(${segs}::text, ',')) as sg)
              )
          ))
          or
          (${subCats}::text is not null and ${subCats}::text != '' and lower(sub_category.name) = any(
              array(select lower(trim(s)) from unnest(string_to_array(${subCats}::text, ',')) as s)
          ))
      )
      order by product_fabric.id desc
      limit ${limit} offset ${offset}
    `);
    return rows.map(mapFabricFilterPreviewRow);
  }
}
