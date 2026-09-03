import * as schema from "../../database/schema/schema.js";
import { eq } from "drizzle-orm";
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, HttpCode, Inject, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { ProductDomainService } from "./product-domain.service.js";

@ApiTags("Category")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class CategoryMigratedDomainController {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly products: ProductDomainService,
  ) {}

  @Get("/get/product-preview-list/:category")
  @ApiOperation({ summary: "Category-filtered product preview list" })
  async get_get_product_preview_list_category(@Param("category") _category: string) {
    // Loom: ProductPreviewController.getProductPreviewList declares {category}
    // and then calls retrieveProductPreviewList() with no arguments — the
    // category is ignored upstream too, so it is ignored here rather than
    // invented. What WAS wrong: the first 50 raw `product` rows under the key
    // "data", where Loom returns the whole prepared preview list under
    // ResponseParameter.PRODUCT_PREVIEW_LIST.
    return keyedResponse("productPreviewList", await this.products.getProductPreviewList());
  }

  @Get("/get/category-list")
  @ApiOperation({ summary: "Fetch product categories" })
  @RequireGate(GateCode.CODE_SU)
  async get_get_category_list(@Query() query: any) {
    try {
      // Query real PostgreSQL database table via Drizzle ORM
      const result = await (this.db as any).select().from(schema.category).limit(50);
      return keyedResponse("data", result || []);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/blog-content-category/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect BlogContentCategory entity by ID" })
  async get_get_table_explorer_data_blog_content_category_id(@Param("id") id: string) {
    const rows = await this.db
      .select()
      .from(schema.blogContentCategory)
      .where(eq(schema.blogContentCategory.id, BigInt(id)))
      .limit(1);
    return keyedResponse("data", rows[0] ?? null);
  }

  @Get("/get/table-explorer/data/story-content-category/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect StoryContentCategory entity by ID" })
  async get_get_table_explorer_data_story_content_category_id(@Param("id") id: string) {
    const rows = await this.db
      .select()
      .from(schema.storyContentCategory)
      .where(eq(schema.storyContentCategory.id, BigInt(id)))
      .limit(1);
    return keyedResponse("data", rows[0] ?? null);
  }
}
