import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { eq, sql, inArray, desc, asc, and, ilike } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  NavMenuCraftResult,
  NavMenuMaterialResult,
  NavMenuPatternResult,
  NavMenuColorResult,
  NavMenuFinishedResult,
  NavMenuStoryResult,
  StoryContentPreview,
  NavProductPreview
} from "../types/navigation.types.js";

@Injectable()
export class NavigationRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async retrieveStoryContents(): Promise<StoryContentPreview[]> {
    const rows = await this.db.select({
      id: schema.storyContent.id,
      title: schema.storyContent.title,
      slug: schema.storyContent.slug,
      bannerImageDesktop: schema.storyContent.bannerImageDesktop,
      bannerImageMobile: schema.storyContent.bannerImageMobile,
      metaTitle: schema.storyContent.metaTitle,
      metaDescription: schema.storyContent.metaDescription
    }).from(schema.storyContent);
    
    return rows.map(r => ({
      ...r,
      id: Number(r.id),
      slug: r.slug ?? ""
    }));
  }

  async fetchProductPreviewForNavigation(group: string): Promise<NavProductPreview[]> {
    const rows = await this.db.select({
      id: schema.product.id,
      slug: schema.product.slug,
      heroImage: schema.product.heroImage,
      productGroup: schema.product.productGroup,
      name: schema.product.name
    })
    .from(schema.product)
    .where(ilike(schema.product.productGroup, group));

    return rows.map(r => ({
      ...r,
      id: Number(r.id),
      heroImage: r.heroImage ?? ""
    }));
  }

  async findNavMenuCraftMapping(): Promise<NavMenuCraftResult[]> {
    const rows = await this.db.execute(sql`
        SELECT 
            se.id AS "segmentCategoryId",
            se.name AS "segmentCategoryName",
            sc.id AS "subCategoryId",
            sc.name AS "subCategoryName"
        FROM segment se
        JOIN sub_category sc ON sc.segment_id = se.id
        JOIN product p ON p.sub_category_id = sc.id
        WHERE LOWER(p.product_group) = 'fabric'
        GROUP BY se.id, se.name, sc.id, sc.name
        ORDER BY se.name, sc.name
    `);

    const list = (rows as unknown as any[]).map(r => ({
      segmentCategoryId: Number(r.segmentCategoryId),
      segmentCategoryName: r.segmentCategoryName,
      subCategoryId: Number(r.subCategoryId),
      subCategoryName: r.subCategoryName
    }));

    if (list.length > 0) return list;

    // Fallback: load available segments and subcategories
    const fallbackRows = await this.db.select({
      segmentCategoryId: schema.segment.id,
      segmentCategoryName: schema.segment.name,
      subCategoryId: schema.subCategory.id,
      subCategoryName: schema.subCategory.name
    })
    .from(schema.subCategory)
    .innerJoin(schema.segment, eq(schema.subCategory.segmentId, schema.segment.id))
    .orderBy(schema.segment.name, schema.subCategory.name);

    return fallbackRows.map(r => ({
      segmentCategoryId: Number(r.segmentCategoryId),
      segmentCategoryName: r.segmentCategoryName,
      subCategoryId: Number(r.subCategoryId),
      subCategoryName: r.subCategoryName
    }));
  }

  async findNavMenuMaterialMapping(): Promise<NavMenuMaterialResult[]> {
    const rows = await this.db.execute(sql`
        SELECT m.id AS "materialId", m.name AS "materialName"
        FROM material m
        JOIN product p ON (
          m.id::text = p.material_id 
          OR p.material_id LIKE '%' || m.id::text || '%'
          OR m.id = ANY(CAST(STRING_TO_ARRAY(NULLIF(REGEXP_REPLACE(p.material_id, '[^0-9,]', '', 'g'), ''), ',') AS BIGINT[]))
        )
        WHERE LOWER(p.product_group) = 'fabric'
        GROUP BY m.id, m.name
        ORDER BY m.name
    `);
    
    const list = (rows as unknown as any[]).map(r => ({
      materialId: Number(r.materialId),
      materialName: r.materialName
    }));

    if (list.length > 0) return list;

    // Fallback: return active materials from material table
    const fallbackMaterials = await this.db.select({
      materialId: schema.material.id,
      materialName: schema.material.name
    }).from(schema.material).orderBy(schema.material.name);

    return fallbackMaterials.map(m => ({
      materialId: Number(m.materialId),
      materialName: m.materialName
    }));
  }

  async findNavMenuPatternMapping(): Promise<NavMenuPatternResult[]> {
    const rows = await this.db.execute(sql`
        SELECT pt.id AS "patternId", pt.name AS "patternName"
        FROM pattern pt
        JOIN product p ON (
          pt.id::text = p.pattern_id 
          OR p.pattern_id LIKE '%' || pt.id::text || '%'
          OR pt.id = ANY(CAST(STRING_TO_ARRAY(NULLIF(REGEXP_REPLACE(p.pattern_id, '[^0-9,]', '', 'g'), ''), ',') AS BIGINT[]))
        )
        WHERE LOWER(p.product_group) = 'fabric'
        GROUP BY pt.id, pt.name
        ORDER BY pt.name
    `);

    const list = (rows as unknown as any[]).map(r => ({
      patternId: Number(r.patternId),
      patternName: r.patternName
    }));

    if (list.length > 0) return list;

    // Fallback: return active patterns from pattern table
    const fallbackPatterns = await this.db.select({
      patternId: schema.pattern.id,
      patternName: schema.pattern.name
    }).from(schema.pattern).orderBy(schema.pattern.name);

    return fallbackPatterns.map(p => ({
      patternId: Number(p.patternId),
      patternName: p.patternName
    }));
  }

  async findNavMenuColorMapping(): Promise<NavMenuColorResult[]> {
    const rows = await this.db.execute(sql`
        SELECT c.id AS "colorId", c.name AS "colorLabel", c.hex AS "colorHexCode"
        FROM color c
        JOIN product p ON (
          c.id::text = p.color_id 
          OR p.color_id LIKE '%' || c.id::text || '%'
          OR c.id = ANY(CAST(STRING_TO_ARRAY(NULLIF(REGEXP_REPLACE(p.color_id, '[^0-9,]', '', 'g'), ''), ',') AS BIGINT[]))
        )
        WHERE LOWER(p.product_group) = 'fabric'
        GROUP BY c.id, c.name, c.hex
        ORDER BY c.hex DESC
    `);

    const list = (rows as unknown as any[]).map(r => ({
      colorId: Number(r.colorId),
      colorLabel: r.colorLabel,
      colorHexCode: r.colorHexCode
    }));

    if (list.length > 0) return list;

    // Fallback: return active colors from color table
    const fallbackColors = await this.db.select({
      colorId: schema.color.id,
      colorLabel: schema.color.name,
      colorHexCode: schema.color.hex
    }).from(schema.color).orderBy(desc(schema.color.hex));

    return fallbackColors.map(c => ({
      colorId: Number(c.colorId),
      colorLabel: c.colorLabel,
      colorHexCode: c.colorHexCode
    }));
  }

  async findNavMenuFinishedMapping(categoryName: string): Promise<NavMenuFinishedResult[]> {
    const rows = await this.db.execute(sql`
        SELECT 
            se.id AS "segmentCategoryId",
            se.name AS "segmentCategoryName",
            sc.id AS "subCategoryId",
            sc.name AS "subCategoryName",
            sc.featured_image AS "subCategoryFeaturedImage"
        FROM category ca
        JOIN segment se ON se.category_id = ca.id
        JOIN sub_category sc ON sc.segment_id = se.id
        JOIN product p ON p.sub_category_id = sc.id
        WHERE LOWER(ca.name) = LOWER(${categoryName})
          AND LOWER(p.product_group) = 'finished'
        GROUP BY se.id, se.name, sc.id, sc.name, sc.featured_image
        ORDER BY se.name, sc.name
    `);

    const list = (rows as unknown as any[]).map(r => ({
      segmentCategoryId: Number(r.segmentCategoryId),
      segmentCategoryName: r.segmentCategoryName,
      subCategoryId: Number(r.subCategoryId),
      subCategoryName: r.subCategoryName,
      subCategoryFeaturedImage: r.subCategoryFeaturedImage
    }));

    if (list.length > 0) return list;

    // Fallback: load segment/subcategories under matching category
    const fallbackRows = await this.db.select({
      segmentCategoryId: schema.segment.id,
      segmentCategoryName: schema.segment.name,
      subCategoryId: schema.subCategory.id,
      subCategoryName: schema.subCategory.name,
      subCategoryFeaturedImage: schema.subCategory.featuredImage
    })
    .from(schema.subCategory)
    .innerJoin(schema.segment, eq(schema.subCategory.segmentId, schema.segment.id))
    .innerJoin(schema.category, eq(schema.segment.categoryId, schema.category.id))
    .where(ilike(schema.category.name, categoryName))
    .orderBy(schema.segment.name, schema.subCategory.name);

    return fallbackRows.map(r => ({
      segmentCategoryId: Number(r.segmentCategoryId),
      segmentCategoryName: r.segmentCategoryName,
      subCategoryId: Number(r.subCategoryId),
      subCategoryName: r.subCategoryName,
      subCategoryFeaturedImage: r.subCategoryFeaturedImage
    }));
  }

  async findNavMenuStoryMapping(storyType: string): Promise<NavMenuStoryResult[]> {
    // story_content_type is an enum column on story_content_category, not a table.
    const wanted = schema.storyContentTypeEnum.enumValues.find(
      (t) => t === storyType.trim().toUpperCase(),
    );
    if (!wanted) return [];

    const rows = await this.db.select({
      storyCategoryId: schema.storyContentCategory.id,
      storyCategoryName: schema.storyContentCategory.name,
      storyId: schema.storyContent.id,
      storyTitle: schema.storyContent.title,
      slug: schema.storyContent.slug,
      bannerImage: schema.storyContent.bannerImageDesktop
    })
    .from(schema.storyContentCategory)
    .innerJoin(schema.storyContent, eq(schema.storyContent.storyContentCategoryId, schema.storyContentCategory.id))
    .where(eq(schema.storyContentCategory.storyContentType, wanted))
    .orderBy(schema.storyContentCategory.name, schema.storyContent.title);

    return rows.map(r => ({
      storyCategoryId: Number(r.storyCategoryId),
      storyCategoryName: r.storyCategoryName,
      storyId: Number(r.storyId),
      storyTitle: r.storyTitle,
      slug: r.slug ?? "",
      bannerImage: r.bannerImage
    }));
  }
}
