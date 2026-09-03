import * as schema from "../../database/schema/schema.js";
import { eq } from "drizzle-orm";
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  Inject,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";

function formatEntity(r: any) {
  if (!r) return null;
  const result: any = {};
  for (const [k, v] of Object.entries(r)) {
    if (typeof v === "bigint") {
      result[k] = String(v);
    } else {
      result[k] = v;
    }
  }
  return result;
}

@ApiTags("Catalog")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class CatalogMigratedDomainController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  @Delete("/delete/artisan/catalog-item/:catalogItemId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete artisan catalog item" })
  @ApiParam({ name: "catalogItemId", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Catalog item deleted" })
  async delete_delete_artisan_catalog_item_catalogItemId(@Param("catalogItemId") catalogItemId: string) {
    await (this.db as any)
      .delete(schema.catalogItem)
      .where(eq(schema.catalogItem.id, BigInt(catalogItemId)));
    return simpleResponse(true, `Catalog item ${catalogItemId} deleted successfully.`);
  }

  @Get("/get/table-explorer/data/catalog-item-media/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect CatalogItemMedia entity by ID" })
  @ApiParam({ name: "id", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Catalog item media by ID" })
  async get_get_table_explorer_data_catalog_item_media_id(@Param("id") id: string) {
    const rows = await (this.db as any)
      .select()
      .from(schema.catalogItemMedia)
      .where(eq(schema.catalogItemMedia.id, BigInt(id)));
    return keyedResponse("data", (rows || []).map(formatEntity));

  }

  @Get("/get/table-explorer/data/catalog-item-media")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for catalog-item-media" })
  @ApiResponse({ status: 200, description: "Catalog item media list" })
  async get_get_table_explorer_data_catalog_item_media() {
    const rows = await (this.db as any)
      .select()
      .from(schema.catalogItemMedia)
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatEntity));

  }

  @Get("/get/table-explorer/data/catalog-item")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for catalog-item" })
  @ApiResponse({ status: 200, description: "Catalog item list" })
  async get_get_table_explorer_data_catalog_item() {
    const rows = await (this.db as any)
      .select()
      .from(schema.catalogItem)
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatEntity));

  }

  @Get("/get/table-explorer/data/catalog-pdf")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for catalog-pdf" })
  @ApiResponse({ status: 200, description: "Catalog PDF list" })
  async get_get_table_explorer_data_catalog_pdf() {
    const rows = await (this.db as any)
      .select()
      .from(schema.catalogPdf)
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatEntity));

  }

  @Get("/get/table-explorer/data/catalog")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for catalog" })
  @ApiResponse({ status: 200, description: "Catalog list" })
  async get_get_table_explorer_data_catalog() {
    const rows = await (this.db as any)
      .select()
      .from(schema.catalog)
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatEntity));

  }
}
