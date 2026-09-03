import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { FabricFilterPreview, FinishedFilterPreview, FabricProductFilterParameters } from "../types/filter.types.js";
import { mapFabricFilterPreviewRow, mapFinishedFilterPreviewRow } from "../mapper/filter.mapper.js";

@Injectable()
export class FilterRepository {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
    ) {}

    async findFabricFilterPreview(category: string | null, segmentCategory: string | null): Promise<FabricFilterPreview[]> {
        const query = sql`
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
            where product.disabled=false
            and (
                ${category || null}::text is null
                or ${category || null}::text = ''
                or lower(category.name) = lower(${category || null}::text)
                or lower(category.name) like ('%' || lower(${category || null}::text) || '%')
                or lower(${category || null}::text) like ('%' || lower(category.name) || '%')
            )
            and (
                ${segmentCategory || null}::text is null
                or ${segmentCategory || null}::text = ''
                or lower(segment.name) = lower(${segmentCategory || null}::text)
                or lower(segment.name) like ('%' || lower(${segmentCategory || null}::text) || '%')
                or lower(${segmentCategory || null}::text) like ('%' || lower(segment.name) || '%')
                or exists (
                    select 1 from unnest(string_to_array(lower(${segmentCategory || null}::text), ' ')) as word
                    where length(word) > 2 and word != 'and' and lower(segment.name) like ('%' || word || '%')
                )
            )
            order by product_fabric.id desc
        `;
        
        const result = await this.db.execute(query);
        return (result as unknown as Record<string, unknown>[]).map(mapFabricFilterPreviewRow);
    }

    async findFabricFilterPreviewPage(category: string | null, segmentCategory: string | null, limit: number, offset: number): Promise<FabricFilterPreview[]> {
        const query = sql`
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
            where product.disabled=false
            and (
                ${category || null}::text is null
                or ${category || null}::text = ''
                or lower(category.name) = lower(${category || null}::text)
                or lower(category.name) like ('%' || lower(${category || null}::text) || '%')
                or lower(${category || null}::text) like ('%' || lower(category.name) || '%')
            )
            and (
                ${segmentCategory || null}::text is null
                or ${segmentCategory || null}::text = ''
                or lower(segment.name) = lower(${segmentCategory || null}::text)
                or lower(segment.name) like ('%' || lower(${segmentCategory || null}::text) || '%')
                or lower(${segmentCategory || null}::text) like ('%' || lower(segment.name) || '%')
                or exists (
                    select 1 from unnest(string_to_array(lower(${segmentCategory || null}::text), ' ')) as word
                    where length(word) > 2 and word != 'and' and lower(segment.name) like ('%' || word || '%')
                )
            )
            order by product_fabric.id desc
            LIMIT ${limit} OFFSET ${offset}
        `;
        
        const result = await this.db.execute(query);
        return (result as unknown as Record<string, unknown>[]).map(mapFabricFilterPreviewRow);
    }

    async findFinishedFilterPreview(category: string | null): Promise<FinishedFilterPreview[]> {
        const query = sql`
            with
                  max_discount_item as (
                      select
                          distinct on (profile_id) profile_id, discount, minimum_order_quantity
                      from volume_discount_profile_item
                      order by profile_id, discount desc
                  ),
                  max_discount_product as (
                      select
                          product.id,
                          product.price,
                          max_discount_item.discount,
                          max_discount_item.minimum_order_quantity
                      from product
                               left join max_discount_item
                                         on max_discount_item.profile_id = product.volume_discount_profile_id
                  ),
                  size_profile_info as (
                      select size_profile.id,
                             jsonb_agg(
                                     jsonb_build_object(
                                             'size_profile_option_id',
                                             size_profile_option.id,
                                             'size_profile_option_label',
                                             size_profile_option.label,
                                             'size_profile_option_consumed_fabric',
                                             size_profile_option.consumed_fabric,
                                             'sort_order',
                                             size_profile_option.sort_order
                                     ) ORDER BY size_profile_option.sort_order
                             ) as size_profile_option_item_list
                      from size_profile
                               left join size_profile_option
                                         on size_profile.id = size_profile_option.profile_id
                      group by size_profile.id
                  ),
                  product_size_profile_info as (
                      select product_size_profile.product_id,
                                 jsonb_agg(
                                          json_build_object(
                                            'product_id',
                                            product_size_profile.product_id,
                                            'size_profile_option_id',
                                            product_size_profile.size_profile_option_id,
                                            'size_profile_option_sku',
                                            product_size_profile.size_profile_option_sku,
                                            'quantity',
                                            product_size_profile.quantity,
                                            'consumed_fabric',
                                            product_size_profile.consumed_fabric
                                    ) ORDER BY product_size_profile.id
                              ) as product_size_profile_option_item_list
                     from product_size_profile
                     group by product_size_profile.product_id
                 ),
                  made_to_order_fabric_discount as (
                      SELECT p.id, json_agg((
                              SELECT vdpi FROM (
                                  SELECT
                                      vdpi.id as volume_discount_item_id,
                                      vdpi.profile_id as volume_discount_profile_id,
                                      vdpi.minimum_order_quantity,
                                      vdpi.discount
                                  ) vdpi
                              )) AS volume_discount_profile_items
                      FROM product p
                      LEFT JOIN volume_discount_profile vdp ON p.volume_discount_profile_id = vdp.id
                      LEFT JOIN volume_discount_profile_item vdpi ON vdp.id = vdpi.profile_id
                      GROUP BY p.id
                  )
            select
                product_finished.id as id,
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
                product.external_quantity as external_quantity,
                product.quantity + product.external_quantity as total_quantity,
                max_discount_product.discount as volume_discount,
                max_discount_item.minimum_order_quantity as volume_discount_minimum_order_quantity,
                made_to_order_profile.consumed_fabric as made_to_order_profile_consumed_fabric,
                made_to_order_profile.minimum_order_quantity as minimum_order_quantity,
                made_to_order_fabric.quantity + made_to_order_fabric.external_quantity as made_to_order_fabric_quantity,
                made_to_order_fabric.price as made_to_order_fabric_price,
                size_profile_info.id as size_profile_id,
                size_profile_info.size_profile_option_item_list as size_profile_option_list,
                product_size_profile_info.product_size_profile_option_item_list as product_size_profile_option_list,
                made_to_order_fabric_discount.volume_discount_profile_items as made_to_order_fabric_discount
            from
            product_finished
                left join product on product_finished.product_id = product.id
                left join sub_category on product.sub_category_id = sub_category.id
                left join segment on sub_category.segment_id = segment.id
                left join category on segment.category_id = category.id
                left join special_status on product.special_status_id = special_status.id
                left join max_discount_item on product.volume_discount_profile_id = max_discount_item.profile_id
                left join max_discount_product on product.id = max_discount_product.id
                left join made_to_order_profile on product.made_to_order_profile_id = made_to_order_profile.id
                left join size_profile_info on product.size_profile_id = size_profile_info.id
                left join product_size_profile_info on product.id = product_size_profile_info.product_id
                left join product as made_to_order_fabric on product.made_to_order_fabric_id = made_to_order_fabric.id
                left join made_to_order_fabric_discount on made_to_order_fabric.id = made_to_order_fabric_discount.id
            where
                product.disabled = false
                and (
                    ${category || null}::text is null
                    or ${category || null}::text = ''
                    or lower(category.name) = lower(${category || null}::text)
                    or lower(category.name) like ('%' || lower(${category || null}::text) || '%')
                    or lower(${category || null}::text) like ('%' || lower(category.name) || '%')
                )
            order by product_finished.id desc
        `;

        const result = await this.db.execute(query);
        return (result as unknown as Record<string, unknown>[]).map(mapFinishedFilterPreviewRow);
    }

    async findSegmentPreview(categoryName?: string | null): Promise<any[]> {
        const query = sql`
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
            where ${categoryName || null}::text is null
                or ${categoryName || null}::text = ''
                or lower(category.name) = lower(${categoryName || null}::text)
                or lower(category.name) like ('%' || lower(${categoryName || null}::text) || '%')
                or lower(${categoryName || null}::text) like ('%' || lower(category.name) || '%')
            order by segment.id desc
        `;

        const result = await this.db.execute(query);
        return (result as unknown as Record<string, unknown>[]) || [];
    }

    async findFabricFilterPreviewFiltered(params: FabricProductFilterParameters): Promise<FabricFilterPreview[]> {
        const offset = params.pageNumber * params.pageSize;
        
        const query = sql`
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
            where product.disabled = false
            and (
                ${params.colors || null}::text is null or ${params.colors || null}::text = '' or exists (
                    select 1
                    from color
                    where lower(color.name) = any(
                        array(select lower(trim(c)) from unnest(string_to_array(${params.colors || null}::text, ',')) as c)
                    )
                    and color.id = any(string_to_array(product.color_id, ',')::bigint[])
                )
            )
            and (
                ${params.materials || null}::text is null or ${params.materials || null}::text = '' or exists (
                    select 1
                    from material
                    where lower(material.name) = any(
                        array(select lower(trim(m)) from unnest(string_to_array(${params.materials || null}::text, ',')) as m)
                    )
                    and material.id = any(string_to_array(product.material_id, ',')::bigint[])
                )
            )
            and (
                ${params.patterns || null}::text is null or ${params.patterns || null}::text = '' or exists (
                    select 1
                    from pattern
                    where lower(pattern.name) = any(
                        array(select lower(trim(p)) from unnest(string_to_array(${params.patterns || null}::text, ',')) as p)
                    )
                    and pattern.id = any(string_to_array(product.pattern_id, ',')::bigint[])
                )
            )
            and (${params.minPrice ?? null}::numeric is null or product.price >= ${params.minPrice ?? null})
            and (${params.maxPrice ?? null}::numeric is null or product.price <= ${params.maxPrice ?? null})
            and (${params.minGSM ?? null}::int is null or product_fabric.gsm >= ${params.minGSM ?? null})
            and (${params.maxGSM ?? null}::int is null or product_fabric.gsm <= ${params.maxGSM ?? null})
            and (
                ((${params.segments || null}::text is null or ${params.segments || null}::text = '') and (${params.subCategories || null}::text is null or ${params.subCategories || null}::text = ''))
                or
                (${params.segments || null}::text is not null and ${params.segments || null}::text != '' and sub_category.segment_id in (
                    select id from segment
                    where lower(segment.name) = any(
                        array(select lower(trim(sg)) from unnest(string_to_array(${params.segments || null}::text, ',')) as sg)
                    )
                ))
                or
                (${params.subCategories || null}::text is not null and ${params.subCategories || null}::text != '' and lower(sub_category.name) = any(
                    array(select lower(trim(s)) from unnest(string_to_array(${params.subCategories || null}::text, ',')) as s)
                ))
            )
            order by product_fabric.id desc
            limit ${params.pageSize} offset ${offset}
        `;

        const result = await this.db.execute(query);
        return (result as unknown as Record<string, unknown>[]).map(mapFabricFilterPreviewRow);
    }
}
