// @ts-nocheck
import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../../database/database.module.js";
import * as schema from "../../../../database/schema/schema.js";
import { eq, inArray, desc } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { BlogContentTypeInput, BlogContentCategoryInput, BlogContentInput, BlogContentSectionInput } from "../types/blog.types.js";

@Injectable()
export class BlogRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // Blog Content Type
  async getBlogContentTypes() {
    return this.db.select().from(schema.blogContentType).orderBy(desc(schema.blogContentType.timeOfCreation));
  }

  async addBlogContentType(data: BlogContentTypeInput) {
    const rows = await this.db.insert(schema.blogContentType).values({
      name: data.name,
      timeOfCreation: Date.now(),
    }).returning();
    return rows[0];
  }

  async updateBlogContentType(id: bigint, data: BlogContentTypeInput) {
    const rows = await this.db.update(schema.blogContentType)
      .set({ name: data.name })
      .where(eq(schema.blogContentType.id, id))
      .returning();
    return rows[0] ?? null;
  }

  // Blog Content Category
  async getBlogContentCategories() {
    return this.db.select().from(schema.blogContentCategory).orderBy(desc(schema.blogContentCategory.timeOfCreation));
  }

  async addBlogContentCategory(blogContentTypeId: bigint, data: BlogContentCategoryInput) {
    const rows = await this.db.insert(schema.blogContentCategory).values({
      blogContentTypeId,
      name: data.name,
      timeOfCreation: Date.now(),
    }).returning();
    return rows[0];
  }

  async updateBlogContentCategory(id: bigint, data: BlogContentCategoryInput) {
    const rows = await this.db.update(schema.blogContentCategory)
      .set({ name: data.name })
      .where(eq(schema.blogContentCategory.id, id))
      .returning();
    return rows[0] ?? null;
  }

  // Blog Content
  async getBlogContentList() {
    return this.db.select().from(schema.blogContent).orderBy(desc(schema.blogContent.timeOfCreation));
  }

  async getBlogContentById(id: bigint) {
    const rows = await this.db.select().from(schema.blogContent).where(eq(schema.blogContent.id, id));
    return rows[0] ?? null;
  }

  async getBlogContentBySlug(slug: string) {
    const rows = await this.db.select().from(schema.blogContent).where(eq(schema.blogContent.slug, slug));
    return rows[0] ?? null;
  }

  async getBlogContentListByCsv(ids: bigint[]) {
    if (ids.length === 0) return [];
    return this.db.select().from(schema.blogContent).where(inArray(schema.blogContent.id, ids));
  }

  async getBlogsByCategory(categoryId: bigint) {
    return this.db.select().from(schema.blogContent).where(eq(schema.blogContent.blogContentCategoryId, categoryId)).orderBy(desc(schema.blogContent.timeOfCreation));
  }

  async addBlogContent(data: BlogContentInput) {
    const rows = await this.db.insert(schema.blogContent).values({
      blogContentCategoryId: data.blogContentCategoryId,
      title: data.title,
      description: data.description,
      readingTime: data.readingTime,
      bannerImageDesktop: data.bannerImageDesktop,
      bannerImageMobile: data.bannerImageMobile,
      bannerImageParallax: data.bannerImageParallax ?? "",
      parallaxText: data.parallaxText ?? "",
      slug: data.slug ?? "",
      previousBlog: data.previousBlog,
      nextBlog: data.nextBlog,
      authorId: data.authorId,
      timeOfCreation: Date.now(),
      lastUpdateTime: Date.now(),
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      bannerImageAlt: data.bannerImageAlt,
      bannerImageParallaxAlt: data.bannerImageParallaxAlt,
      backwardCompatibleLink: data.backwardCompatibleLink,
    }).returning();
    return rows[0];
  }

  async updateBlogContent(id: bigint, data: BlogContentInput) {
    const rows = await this.db.update(schema.blogContent)
      .set({
        blogContentCategoryId: data.blogContentCategoryId,
        title: data.title,
        description: data.description,
        readingTime: data.readingTime,
        bannerImageDesktop: data.bannerImageDesktop,
        bannerImageMobile: data.bannerImageMobile,
        bannerImageParallax: data.bannerImageParallax,
        parallaxText: data.parallaxText,
        slug: data.slug,
        previousBlog: data.previousBlog,
        nextBlog: data.nextBlog,
        authorId: data.authorId,
        lastUpdateTime: Date.now(),
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        bannerImageAlt: data.bannerImageAlt,
        bannerImageParallaxAlt: data.bannerImageParallaxAlt,
        backwardCompatibleLink: data.backwardCompatibleLink,
      })
      .where(eq(schema.blogContent.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async deleteBlogContent(id: bigint) {
    await this.db.delete(schema.blogContent).where(eq(schema.blogContent.id, id));
  }

  // Blog Content Section
  async getBlogContentSections(blogContentId: bigint) {
    return this.db.select().from(schema.blogContentSection).where(eq(schema.blogContentSection.blogContentId, blogContentId));
  }

  async addBlogContentSection(data: BlogContentSectionInput) {
    const rows = await this.db.insert(schema.blogContentSection).values({
      blogContentId: data.blogContentId,
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

  async updateBlogContentSection(id: bigint, data: BlogContentSectionInput) {
    const rows = await this.db.update(schema.blogContentSection)
      .set({
        blogContentId: data.blogContentId,
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
      .where(eq(schema.blogContentSection.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async deleteBlogContentSection(id: bigint) {
    await this.db.delete(schema.blogContentSection).where(eq(schema.blogContentSection.id, id));
  }
}
// @ts-nocheck
// @ts-nocheck
