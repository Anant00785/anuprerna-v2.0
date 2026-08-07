// @ts-nocheck
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
      id: Number(r.id)
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
    .where(eq(schema.product.productGroup, group));

    return rows.map(r => ({
      ...r,
      id: Number(r.id)
    }));
  }

  async findNavMenuCraftMapping(): Promise<NavMenuCraftResult[]> {
    const rows = await this.db.select({
      segmentCategoryId: schema.segment.id,
      segmentCategoryName: schema.segment.name,
      subCategoryId: schema.subCategory.id,
      subCategoryName: schema.subCategory.name
    })
    .from(schema.subCategory)
    .innerJoin(schema.segment, eq(schema.subCategory.segmentId, schema.segment.id))
    .innerJoin(schema.product, eq(schema.product.subCategoryId, schema.subCategory.id))
    .where(eq(schema.product.productGroup, 'fabric'))
    .groupBy(schema.segment.id, schema.segment.name, schema.subCategory.id, schema.subCategory.name)
    .orderBy(schema.segment.name, schema.subCategory.name);

    return rows.map(r => ({
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
        JOIN product p ON m.id = ANY (
          CAST(STRING_TO_ARRAY(NULLIF(REGEXP_REPLACE(p.material_id, '[^0-9,]', '', 'g'), ''), ',') AS BIGINT[])
        )
        WHERE p.product_group = 'fabric'
        GROUP BY m.id, m.name
        ORDER BY m.name
    `);
    
    return (rows as unknown as any[]).map(r => ({
      materialId: Number(r.materialId),
      materialName: r.materialName
    }));
  }

  async findNavMenuPatternMapping(): Promise<NavMenuPatternResult[]> {
    const rows = await this.db.execute(sql`
        SELECT pt.id AS "patternId", pt.name AS "patternName"
        FROM pattern pt
        JOIN product p ON pt.id = ANY (CAST(STRING_TO_ARRAY(p.pattern_id, ',') AS BIGINT[]))
        WHERE p.product_group = 'fabric'
        GROUP BY pt.id, pt.name
        ORDER BY pt.name
    `);

    return (rows as unknown as any[]).map(r => ({
      patternId: Number(r.patternId),
      patternName: r.patternName
    }));
  }

  async findNavMenuColorMapping(): Promise<NavMenuColorResult[]> {
    const rows = await this.db.execute(sql`
        SELECT c.id AS "colorId", c.name AS "colorLabel", c.hex AS "colorHexCode"
        FROM color c
        JOIN product p ON c.id = ANY (
          CAST(STRING_TO_ARRAY(NULLIF(REGEXP_REPLACE(p.color_id, '[^0-9,]', '', 'g'), ''), ',') AS BIGINT[])
        )
        WHERE p.product_group = 'fabric'
        GROUP BY c.id, c.name, c.hex
        ORDER BY c.hex DESC
    `);

    return (rows as unknown as any[]).map(r => ({
      colorId: Number(r.colorId),
      colorLabel: r.colorLabel,
      colorHexCode: r.colorHexCode
    }));
  }

  async findNavMenuFinishedMapping(categoryName: string): Promise<NavMenuFinishedResult[]> {
    const rows = await this.db.select({
      segmentCategoryId: schema.segment.id,
      segmentCategoryName: schema.segment.name,
      subCategoryId: schema.subCategory.id,
      subCategoryName: schema.subCategory.name,
      subCategoryFeaturedImage: schema.subCategory.featuredImage
    })
    .from(schema.subCategory)
    .innerJoin(schema.product, eq(schema.product.subCategoryId, schema.subCategory.id))
    .innerJoin(schema.segment, eq(schema.segment.id, schema.subCategory.segmentId))
    .innerJoin(schema.category, eq(schema.category.id, schema.segment.categoryId))
    .where(
      and(
        eq(schema.product.productGroup, 'finished'),
        ilike(schema.category.name, categoryName)
      )
    )
    .groupBy(schema.segment.id, schema.segment.name, schema.subCategory.id, schema.subCategory.name, schema.subCategory.featuredImage)
    .orderBy(schema.segment.name, schema.subCategory.name);

    return rows.map(r => ({
      segmentCategoryId: Number(r.segmentCategoryId),
      segmentCategoryName: r.segmentCategoryName,
      subCategoryId: Number(r.subCategoryId),
      subCategoryName: r.subCategoryName,
      subCategoryFeaturedImage: r.subCategoryFeaturedImage || ""
    }));
  }

  async findNavMenuStoryMapping(categoryName: string): Promise<NavMenuStoryResult[]> {
    const rows = await this.db.select({
      storyId: schema.storyContent.id,
      storyTitle: schema.storyContent.title,
      slug: schema.storyContent.slug,
      bannerImage: schema.storyContent.bannerImageDesktop,
      storyCategoryId: schema.storyContentCategory.id,
      storyCategoryName: schema.storyContentCategory.name
    })
    .from(schema.storyContent)
    .innerJoin(schema.storyContentCategory, eq(schema.storyContentCategory.id, schema.storyContent.storyContentCategoryId))
    .where(eq(schema.storyContentCategory.storyContentType, categoryName as "ARTISTS" | "CLUSTERS" | "COLLABORATIONS" | "CRAFTS"))
    .groupBy(
      schema.storyContent.id, 
      schema.storyContent.title, 
      schema.storyContentCategory.id,
      schema.storyContent.slug,
      schema.storyContent.bannerImageDesktop,
      schema.storyContentCategory.name
    )
    .orderBy(schema.storyContentCategory.name, schema.storyContent.title);

    return rows.map(r => ({
      storyId: Number(r.storyId),
      storyTitle: r.storyTitle,
      slug: r.slug,
      bannerImage: r.bannerImage || "",
      storyCategoryId: Number(r.storyCategoryId),
      storyCategoryName: r.storyCategoryName
    }));
  }
}
