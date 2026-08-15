import { Body, Controller, Get, HttpCode, Inject, Post, Query } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { CompatibilityService } from "./compatibility.service.js";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import * as schema from "../../database/schema/schema.js";
import { eq, or } from "drizzle-orm";
import { keyedResponse } from "../../common/response/rain-response.js";

const BASE_REDIRECT_URL = process.env.SITE_URL || "https://anuprerna.com";

@ApiTags("Compatibility")
@Controller()
export class CompatibilityController {
  constructor(
    private readonly service: CompatibilityService,
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  @Get("get/compatibility")
  @ApiOperation({ summary: "Get all compatibility records" })
  async getAll() {
    return this.service.getAll();
  }

  @Get("redirect/product")
  @ApiOperation({ summary: "Legacy URL redirect mapping for products" })
  @ApiQuery({ name: "slug", required: true, description: "Legacy backwards-compatible product slug" })
  async redirectProduct(@Query("slug") slug?: string) {
    if (!slug) {
      return { success: true, response: `${BASE_REDIRECT_URL}/product/fabric-product` };
    }

    try {
      const decodedSlug = decodeURIComponent(slug);
      const rows = await this.db
        .select({
          slug: schema.product.slug,
          productGroup: schema.product.productGroup,
        })
        .from(schema.product)
        .where(
          or(
            eq(schema.product.backwardCompatibleLink, decodedSlug),
            eq(schema.product.slug, decodedSlug),
          ),
        )
        .limit(1);

      if (rows.length > 0 && rows[0]) {
        const found = rows[0];
        const isFabric = found.productGroup === "fabric" || !found.productGroup;
        const redirectUrl = isFabric
          ? `${BASE_REDIRECT_URL}/product/fabric-product/${found.slug}`
          : `${BASE_REDIRECT_URL}/product/finished-product/${found.slug}`;
        return { success: true, response: redirectUrl };
      }

      return { success: true, response: `${BASE_REDIRECT_URL}/product/fabric-product` };
    } catch (err) {
      return { success: true, response: `${BASE_REDIRECT_URL}/product/fabric-product` };
    }
  }

  @Get("redirect/story")
  @ApiOperation({ summary: "Legacy URL redirect mapping for story content" })
  @ApiQuery({ name: "slug", required: true, description: "Legacy backwards-compatible story slug" })
  async redirectStory(@Query("slug") slug?: string) {
    if (!slug) {
      return { success: true, response: `${BASE_REDIRECT_URL}/404` };
    }

    try {
      const decodedSlug = decodeURIComponent(slug);
      const rows = await this.db
        .select({
          id: schema.storyContent.id,
          slug: schema.storyContent.slug,
        })
        .from(schema.storyContent)
        .where(
          or(
            eq(schema.storyContent.backwardCompatibleLink, decodedSlug),
            eq(schema.storyContent.slug, decodedSlug),
          ),
        )
        .limit(1);

      if (rows.length > 0 && rows[0]) {
        const found = rows[0];
        return { success: true, response: `${BASE_REDIRECT_URL}/story-details/${found.slug}/${found.id}` };
      }

      return { success: true, response: `${BASE_REDIRECT_URL}/404` };
    } catch (err) {
      return { success: true, response: `${BASE_REDIRECT_URL}/404` };
    }
  }

  @Get("redirect/blog")
  @ApiOperation({ summary: "Legacy URL redirect mapping for blog articles" })
  @ApiQuery({ name: "slug", required: true, description: "Legacy backwards-compatible blog slug" })
  async redirectBlog(@Query("slug") slug?: string) {
    if (!slug) {
      return { success: true, response: `${BASE_REDIRECT_URL}/404` };
    }

    try {
      const decodedSlug = decodeURIComponent(slug);
      const rows = await this.db
        .select({
          id: schema.blogContent.id,
          slug: schema.blogContent.slug,
        })
        .from(schema.blogContent)
        .where(
          or(
            eq(schema.blogContent.backwardCompatibleLink, decodedSlug),
            eq(schema.blogContent.slug, decodedSlug),
          ),
        )
        .limit(1);

      if (rows.length > 0 && rows[0]) {
        const found = rows[0];
        return { success: true, response: `${BASE_REDIRECT_URL}/blogs/${found.slug}/${found.id}` };
      }

      return { success: true, response: `${BASE_REDIRECT_URL}/404` };
    } catch (err) {
      return { success: true, response: `${BASE_REDIRECT_URL}/404` };
    }
  }

  @Post("create/compatibility")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a compatibility record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}
