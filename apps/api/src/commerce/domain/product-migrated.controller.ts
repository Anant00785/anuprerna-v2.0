import * as schema from "../../database/schema/schema.js";
import { eq, inArray } from "drizzle-orm";
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, HttpCode, Inject, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiParam, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { ProductDomainService } from "./product-domain.service.js";

@ApiTags("Product")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class ProductMigratedDomainController {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly products: ProductDomainService,
  ) {}

  @Get("/get/product-preview-list/csv/:commaSeparatedCSVList")
  @ApiOperation({ summary: "Bulk product preview retrieval by SKU list" })
  async get_get_product_preview_list_csv_commaSeparatedCSVList(@Param('commaSeparatedCSVList') commaSeparatedCSVList: string) {
    const skuList = (commaSeparatedCSVList || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (skuList.length === 0) {
      return { success: true, message: "", productPreviewList: [], data: [] };
    }

    // No catch fabricating an empty success envelope: a DB failure propagates
    // as an error instead of rendering as "no products found".
    const rows = await (this.db as any)
      .select({
        id: schema.product.id,
        productId: schema.product.id,
        name: schema.product.name,
        sku: schema.product.sku,
        heroImage: schema.product.heroImage,
        price: schema.product.price,
        unit: schema.product.unit,
        slug: schema.product.slug,
        productGroup: schema.product.productGroup,
      })
      .from(schema.product)
      .where(inArray(schema.product.sku, skuList));

    return {
      success: true,
      message: "",
      productPreviewList: rows || [],
      data: rows || [],
    };
  }

  @Get("/get/related-products/id/:csv")
  @ApiOperation({ summary: "Fetch cross-sell related products by ID list" })
  @ApiParam({ name: "csv", description: "Comma-separated product IDs", type: String, example: "101,102" })
  async get_get_related_products_id_csv(@Param("csv") csv: string) {
    // Loom: ProductController.getRelatedProductsByIdCSV ->
    // resolveRelatedProductsByIdCSV, keyed ResponseParameter.RELATED_PRODUCTS_LIST.
    // Previously returned the first 50 products for ANY csv, so every product
    // page rendered the same "related products" strip.
    return keyedResponse("relatedProductsList", await this.products.getRelatedProductsByIdCsv(csv));
  }

  @Get("/check/unique-product/sku/:sku")
  @ApiOperation({ summary: "Check SKU availability" })
  @ApiParam({ name: "sku", description: "Product SKU to check", type: String, example: "DAN1200452" })
  @RequireGate(GateCode.CODE_SUCUAR)
  async get_check_unique_product_sku_sku(@Param('sku') sku: string) {
    try {
      const existing = await this.db.select({ id: schema.product.id }).from(schema.product).where(eq(schema.product.sku, sku)).limit(1);
      const isUnique = existing.length === 0;
      return simpleResponse(isUnique, isUnique ? "SKU is available." : "SKU is already in use.");
    } catch (err) {
      console.error("[Check SKU Error]:", err);
      return simpleResponse(false, "Failed to check SKU availability.");
    }
  }

  @Get("/check/unique-product/name/:name")
  @ApiOperation({ summary: "Check product name availability" })
  @ApiParam({ name: "name", description: "Product name to check", type: String, example: "Pure Cotton Fabric" })
  @RequireGate(GateCode.CODE_SUCUAR)
  async get_check_unique_product_name_name(@Param('name') name: string) {
    try {
      const existing = await this.db.select({ id: schema.product.id }).from(schema.product).where(eq(schema.product.name, name)).limit(1);
      const isUnique = existing.length === 0;
      return simpleResponse(isUnique, isUnique ? "Product name is available." : "Product name is already in use.");
    } catch (err) {
      console.error("[Check Name Error]:", err);
      return simpleResponse(false, "Failed to check product name availability.");
    }
  }

  @Patch("/update/bulk/product-price")
  @ApiOperation({ summary: "Bulk update product prices across catalog" })
  @ApiBody({
    description: "List of SKU and new prices to update",
    schema: {
      type: "object",
      properties: {
        productPriceList: {
          type: "array",
          items: {
            type: "object",
            properties: {
              sku: { type: "string", example: "DAN1200452" },
              price: { type: "number", example: 499.00 }
            },
            required: ["sku", "price"]
          }
        }
      },
      required: ["productPriceList"]
    }
  })
  @RequireGate(GateCode.CODE_SU)
  async patch_update_bulk_product_price(@Body() body: any) {
    try {
      const list = body?.productPriceList || [];
      if (Array.isArray(list) && list.length > 0) {
        for (const item of list) {
          if (item.sku && item.price !== undefined) {
            await this.db.update(schema.product).set({ price: item.price }).where(eq(schema.product.sku, item.sku));
          }
        }
      }
      return simpleResponse(true, "Bulk product prices updated successfully.");
    } catch (err) {
      return simpleResponse(false, "Failed to update bulk product prices.");
    }
  }

  @Get("/get/sku-group-list")
  @ApiOperation({ summary: "Fetch SKU groups list" })
  @RequireGate(GateCode.CODE_SUCU)
  async get_get_sku_group_list(@Query() query: any) {
    const result = await (this.db as any).select().from(schema.skuGroup).limit(50);
    return keyedResponse("skuGroupList", result || []);

  }

  @Get("/get/special-status-list")
  @ApiOperation({ summary: "Fetch product special statuses" })
  @RequireGate(GateCode.CODE_SUCU)
  async get_get_special_status_list(@Query() query: any) {
    const result = await (this.db as any).select().from(schema.specialStatus).limit(50);
    return keyedResponse("specialStatusList", result || []);

  }

  @Get("/get/tag-list")
  @ApiOperation({ summary: "Fetch product tags list" })
  @RequireGate(GateCode.CODE_SUCU)
  async get_get_tag_list(@Query() query: any) {
    const result = await (this.db as any).select().from(schema.tag).limit(50);
    return keyedResponse("tagList", result || []);

  }

  @Get("/get/table-explorer/data/product-vector/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect ProductVector entity by ID" })
  async get_get_table_explorer_data_product_vector_id(@Param("id") id: string) {
    const rows = await this.db
      .select()
      .from(schema.productVector)
      .where(eq(schema.productVector.id, BigInt(id)))
      .limit(1);
    return keyedResponse("data", rows[0] ?? null);
  }

  @Get("/get/table-explorer/data/story-product-mapping/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect StoryProductMapping entity by ID" })
  async get_get_table_explorer_data_story_product_mapping_id(@Param("id") id: string) {
    const rows = await this.db
      .select()
      .from(schema.storyProductMapping)
      .where(eq(schema.storyProductMapping.id, BigInt(id)))
      .limit(1);
    return keyedResponse("data", rows[0] ?? null);
  }

  @Post("/update/story-product/relation")
  @ApiOperation({ summary: "Update product-story association" })
  @ApiBody({
    description: "Story to product mapping payload",
    schema: {
      type: "object",
      properties: {
        storyContentId: { type: "number", example: 1 },
        fabricProductIdList: {
          type: "array",
          items: { type: "number" },
          example: [145345, 60301]
        },
        finishedProductIdList: {
          type: "array",
          items: { type: "number" },
          example: [201, 202]
        }
      },
      required: ["storyContentId"]
    }
  })
  @RequireGate(GateCode.CODE_SU)
  async post_update_story_product_relation(@Body() body: any) {
    try {
      const storyContentId = body?.storyContentId;
      const fabricIds = body?.fabricProductIdList || [];
      const finishedIds = body?.finishedProductIdList || [];
      
      if (!storyContentId) {
        return simpleResponse(false, "Story content ID is required.");
      }

      const csv = Array.isArray(fabricIds) ? fabricIds.join(",") : "";
      
      const existing = await this.db.select().from(schema.storyProductMapping).where(eq(schema.storyProductMapping.storyContentId, storyContentId)).limit(1);
      
      if (existing.length > 0) {
        await this.db.update(schema.storyProductMapping).set({
          productIdCsv: csv,
          finishProductIds: finishedIds,
        }).where(eq(schema.storyProductMapping.storyContentId, storyContentId));
      } else {
        await this.db.insert(schema.storyProductMapping).values({
          storyContentId: storyContentId,
          productIdCsv: csv,
          finishProductIds: finishedIds,
          version: 1 as any,
        });
      }
      
      return simpleResponse(true, "Story product association updated successfully.");
    } catch (err) {
      console.error("[Story Product Relation Error]:", err);
      return simpleResponse(false, "Failed to update story product association.");
    }
  }
  @Get("/get/table-explorer/data/product-fabric")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Migrated Java LOOM endpoint GET /get/table-explorer/data/product-fabric" })
  async get_get_table_explorer_data_product_fabric(@Query() query: any) {
    // Query real PostgreSQL database table via Drizzle ORM
    const result = await (this.db as any).select().from(schema.productFabric).limit(50);
    return keyedResponse("data", result || []);

  }

  @Get("/get/table-explorer/data/product-finished")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Migrated Java LOOM endpoint GET /get/table-explorer/data/product-finished" })
  async get_get_table_explorer_data_product_finished(@Query() query: any) {
    // Query real PostgreSQL database table via Drizzle ORM
    const result = await (this.db as any).select().from(schema.productFinished).limit(50);
    return keyedResponse("data", result || []);

  }

  @Get("/get/table-explorer/data/product-vector")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Migrated Java LOOM endpoint GET /get/table-explorer/data/product-vector" })
  async get_get_table_explorer_data_product_vector(@Query() query: any) {
    // Query real PostgreSQL database table via Drizzle ORM
    const result = await (this.db as any).select().from(schema.productVector).limit(50);
    return keyedResponse("data", result || []);

  }

}
