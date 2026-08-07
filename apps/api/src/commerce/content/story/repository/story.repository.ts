// @ts-nocheck
import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../../database/database.module.js";
import * as schema from "../../../../database/schema/schema.js";
import { eq, inArray, desc, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { StoryContentCategoryInput, StoryContentInput, StoryContentSectionInput, StoryProductMappingInput } from "../types/story.types.js";

@Injectable()
export class StoryRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // Story Content Category
  async getStoryContentCategories() {
    return this.db.select().from(schema.storyContentCategory).orderBy(desc(schema.storyContentCategory.timeOfCreation));
  }

  async addStoryContentCategory(data: StoryContentCategoryInput) {
    const rows = await this.db.insert(schema.storyContentCategory).values({
      name: data.name,
      timeOfCreation: Date.now(),
    }).returning();
    return rows[0];
  }

  async updateStoryContentCategory(id: bigint, data: StoryContentCategoryInput) {
    const rows = await this.db.update(schema.storyContentCategory)
      .set({ name: data.name })
      .where(eq(schema.storyContentCategory.id, id))
      .returning();
    return rows[0] ?? null;
  }

  // Story Content
  async getStoryContentList() {
    return this.db.select().from(schema.storyContent).orderBy(desc(schema.storyContent.timeOfCreation));
  }

  async getStoryContentById(id: bigint) {
    const rows = await this.db.select().from(schema.storyContent).where(eq(schema.storyContent.id, id));
    return rows[0] ?? null;
  }

  async getStoryContentBySlug(slug: string) {
    const rows = await this.db.select().from(schema.storyContent).where(eq(schema.storyContent.slug, slug));
    return rows[0] ?? null;
  }

  async getStoryContentListByCsv(ids: bigint[]) {
    if (ids.length === 0) return [];
    return this.db.select().from(schema.storyContent).where(inArray(schema.storyContent.id, ids));
  }

  async getStoriesByCategory(categoryId: bigint) {
    return this.db.select().from(schema.storyContent).where(eq(schema.storyContent.storyContentCategoryId, categoryId)).orderBy(desc(schema.storyContent.timeOfCreation));
  }

  async addStoryContent(data: StoryContentInput) {
    const rows = await this.db.insert(schema.storyContent).values({
      storyContentCategoryId: data.storyContentCategoryId,
      title: data.title,
      description: data.description,
      readingTime: data.readingTime,
      bannerImageDesktop: data.bannerImageDesktop,
      bannerImageMobile: data.bannerImageMobile,
      bannerImageParallax: data.bannerImageParallax ?? "",
      parallaxText: data.parallaxText ?? "",
      slug: data.slug ?? "",
      previousStory: data.previousStory,
      nextStory: data.nextStory,
      authorId: data.authorId,
      timeOfCreation: Date.now(),
      lastUpdateTime: Date.now(),
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      bannerImageAlt: data.bannerImageAlt,
      bannerImageParallaxAlt: data.bannerImageParallaxAlt,
    }).returning();
    return rows[0];
  }

  async updateStoryContent(id: bigint, data: StoryContentInput) {
    const rows = await this.db.update(schema.storyContent)
      .set({
        storyContentCategoryId: data.storyContentCategoryId,
        title: data.title,
        description: data.description,
        readingTime: data.readingTime,
        bannerImageDesktop: data.bannerImageDesktop,
        bannerImageMobile: data.bannerImageMobile,
        bannerImageParallax: data.bannerImageParallax,
        parallaxText: data.parallaxText,
        slug: data.slug,
        previousStory: data.previousStory,
        nextStory: data.nextStory,
        authorId: data.authorId,
        lastUpdateTime: Date.now(),
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        bannerImageAlt: data.bannerImageAlt,
        bannerImageParallaxAlt: data.bannerImageParallaxAlt,
      })
      .where(eq(schema.storyContent.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async deleteStoryContent(id: bigint) {
    await this.db.delete(schema.storyContent).where(eq(schema.storyContent.id, id));
  }

  // Story Content Section
  async getStoryContentSections(storyContentId: bigint) {
    return this.db.select().from(schema.storyContentSection).where(eq(schema.storyContentSection.storyContentId, storyContentId));
  }

  async addStoryContentSection(data: StoryContentSectionInput) {
    const rows = await this.db.insert(schema.storyContentSection).values({
      storyContentId: data.storyContentId,
      templateType: data.templateType,
      templateColor: data.templateColor,
      sortOrder: data.sortOrder,
      image1: data.image1,
      image2: data.image2,
      caption1: data.caption1,
      caption2: data.caption2,
      video1: data.video1,
      video2: data.video2,
      heading: data.heading,
      title1: data.title1,
      title2: data.title2,
      paragraph1: data.paragraph1,
      paragraph2: data.paragraph2,
      ctaButtonName1: data.ctaButtonName1,
      ctaLink1: data.ctaLink1,
      ctaButtonName2: data.ctaButtonName2,
      ctaLink2: data.ctaLink2,
      topMotif: data.topMotif,
      bottomMotif: data.bottomMotif,
      image1Alt: data.image1Alt,
      image2Alt: data.image2Alt,
      video1Alt: data.video1Alt,
      video2Alt: data.video2Alt,
      image1Link: data.image1Link,
      image2Link: data.image2Link,
    }).returning();
    return rows[0];
  }

  async updateStoryContentSection(id: bigint, data: StoryContentSectionInput) {
    const rows = await this.db.update(schema.storyContentSection)
      .set({
        storyContentId: data.storyContentId,
        templateType: data.templateType,
        templateColor: data.templateColor,
        sortOrder: data.sortOrder,
        image1: data.image1,
        image2: data.image2,
        caption1: data.caption1,
        caption2: data.caption2,
        video1: data.video1,
        video2: data.video2,
        heading: data.heading,
        title1: data.title1,
        title2: data.title2,
        paragraph1: data.paragraph1,
        paragraph2: data.paragraph2,
        ctaButtonName1: data.ctaButtonName1,
        ctaLink1: data.ctaLink1,
        ctaButtonName2: data.ctaButtonName2,
        ctaLink2: data.ctaLink2,
        topMotif: data.topMotif,
        bottomMotif: data.bottomMotif,
        image1Alt: data.image1Alt,
        image2Alt: data.image2Alt,
        video1Alt: data.video1Alt,
        video2Alt: data.video2Alt,
        image1Link: data.image1Link,
        image2Link: data.image2Link,
      })
      .where(eq(schema.storyContentSection.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async deleteStoryContentSection(id: bigint) {
    await this.db.delete(schema.storyContentSection).where(eq(schema.storyContentSection.id, id));
  }

  // Story Product Mapping
  async getStoryRelatedToProduct(productId: bigint) {
    return this.db.select().from(schema.storyProductMapping).where(
      sql`${schema.storyProductMapping.productIdCsv} ~ ${`(^|,)${productId.toString()}(,|$)`}`,
    );
  }

  async getProductsRelatedToStory(storyContentId: bigint) {
    return this.db.select().from(schema.storyProductMapping).where(eq(schema.storyProductMapping.storyContentId, storyContentId));
  }

  async addStoryProductMapping(data: StoryProductMappingInput) {
    const rows = await this.db.insert(schema.storyProductMapping).values({
      storyContentId: data.storyContentId,
      productIdCsv: data.productId.toString(),
    }).returning();
    return rows[0];
  }

  async updateStoryProductMapping(id: bigint, data: StoryProductMappingInput) {
    const rows = await this.db.update(schema.storyProductMapping)
      .set({
        storyContentId: data.storyContentId,
        productIdCsv: data.productId.toString(),
      })
      .where(eq(schema.storyProductMapping.id, id))
      .returning();
    return rows[0] ?? null;
  }
}
