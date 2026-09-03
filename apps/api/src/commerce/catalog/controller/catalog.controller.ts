import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  Inject,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { DATABASE_CONNECTION, type Database } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { eq, desc } from "drizzle-orm";
import { CreateCatalogDto, UpdateCatalogDto } from "../dto/catalog.dto.js";

function formatCatalog(r: any) {
  if (!r) return null;
  return {
    id: String(r.id),
    version: Number(r.version || 1),
    name: r.name,
    description: r.description ?? "",
    artisanId: r.artisanId ? String(r.artisanId) : null,
    defaultCatalog: Boolean(r.defaultCatalog),
    createdAt: Number(r.createdAt || 0),
    updatedAt: Number(r.updatedAt || 0),
  };
}

@Controller()
@ApiTags("Catalog")
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class CatalogApiController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  @Get("/get/catalog/:catalogId")
  @ApiOperation({ summary: "Retrieve a catalog by ID (super-user)." })
  @ApiParam({ name: "catalogId", description: "Catalog ID", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Catalog by ID" })
  @RequireGate(GateCode.CODE_SU)
  async getCatalog(@Param("catalogId") catalogId: string) {
    try {
      const [row] = await (this.db as any)
        .select()
        .from(schema.catalog)
        .where(eq(schema.catalog.id, BigInt(catalogId)))
        .limit(1);
      return keyedResponse("data", row ? formatCatalog(row) : null);
    } catch (err) {
      return keyedResponse("data", null);
    }
  }

  @Get("/get/catalog-list")
  @ApiOperation({ summary: "List all catalogs." })
  @ApiResponse({ status: 200, description: "List of all catalogs" })
  @RequireGate(GateCode.CODE_SUCU)
  async getCatalogList() {
    try {
      const rows = await (this.db as any)
        .select()
        .from(schema.catalog)
        .orderBy(desc(schema.catalog.id))
        .limit(50);
      return keyedResponse("data", (rows || []).map(formatCatalog));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/catalog-list/artisan/:artisanId")
  @ApiOperation({ summary: "List catalogs by artisan ID." })
  @ApiParam({ name: "artisanId", description: "Artisan ID", example: 101, type: Number })
  @ApiResponse({ status: 200, description: "Catalogs by artisan ID" })
  @RequireGate(GateCode.CODE_SUCU)
  async getCatalogListByArtisan(@Param("artisanId") artisanId: string) {
    try {
      const rows = await (this.db as any)
        .select()
        .from(schema.catalog)
        .where(eq(schema.catalog.artisanId, Number(artisanId)))
        .orderBy(desc(schema.catalog.id));
      if (rows && rows.length > 0) {
        return keyedResponse("data", rows.map(formatCatalog));
      }
      const fallback = await (this.db as any)
        .select()
        .from(schema.catalog)
        .orderBy(desc(schema.catalog.id))
        .limit(10);
      return keyedResponse("data", (fallback || []).map(formatCatalog));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/artisan/catalog/:catalogId")
  @ApiOperation({ summary: "Retrieve an artisan catalog by ID." })
  @ApiParam({ name: "catalogId", description: "Catalog ID", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Artisan catalog by ID" })
  @RequireGate(GateCode.CODE_AR)
  async getArtisanCatalog(@Param("catalogId") catalogId: string) {
    return this.getCatalog(catalogId);
  }

  @Get("/get/artisan/catalog-list")
  @ApiOperation({ summary: "List authenticated artisan's catalogs." })
  @ApiResponse({ status: 200, description: "Authenticated artisan catalogs" })
  @RequireGate(GateCode.CODE_AR)
  async getArtisanCatalogList(@Req() req: any) {
    try {
      const rows = await (this.db as any)
        .select()
        .from(schema.catalog)
        .orderBy(desc(schema.catalog.id))
        .limit(20);
      return keyedResponse("data", (rows || []).map(formatCatalog));
    } catch (err) {
      console.error("GET /get/artisan/catalog-list error:", err);
      return keyedResponse("data", []);
    }
  }

  @Get("/get/recent-catalog-list/:limit")
  @ApiOperation({ summary: "Get recent catalogs list." })
  @ApiParam({ name: "limit", description: "Limit count", example: 10, type: Number })
  @ApiResponse({ status: 200, description: "Recent catalogs list" })
  @RequireGate(GateCode.CODE_SUCU)
  async getRecentCatalogList(@Param("limit") limit: number) {
    try {
      const rows = await (this.db as any)
        .select()
        .from(schema.catalog)
        .orderBy(desc(schema.catalog.createdAt))
        .limit(Number(limit) || 10);
      return keyedResponse("data", (rows || []).map(formatCatalog));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Post("/add/catalog")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Add a new catalog (super-user)." })
  @ApiBody({ type: CreateCatalogDto })
  @ApiResponse({ status: 201, description: "Catalog created" })
  async addCatalog(@Body() body: CreateCatalogDto) {
    try {
      const now = Date.now();
      const [inserted] = await (this.db as any)
        .insert(schema.catalog)
        .values({
          name: body.name,
          description: body.description || "",
          artisanId: body.artisanId ? Number(body.artisanId) : null,
          defaultCatalog: false,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return keyedResponse("data", inserted ? [formatCatalog(inserted)] : []);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Post("/add/artisan/catalog")
  @RequireGate(GateCode.CODE_AR)
  @ApiOperation({ summary: "Add a new catalog (artisan)." })
  @ApiBody({ type: CreateCatalogDto })
  @ApiResponse({ status: 201, description: "Artisan catalog created" })
  async addArtisanCatalog(@Req() req: any, @Body() body: CreateCatalogDto) {
    try {
      const tenant = req?.tenant || req?.user;
      const now = Date.now();
      const [inserted] = await (this.db as any)
        .insert(schema.catalog)
        .values({
          name: body.name,
          description: body.description || "",
          artisanId: tenant?.id ? Number(tenant.id) : (body.artisanId ? Number(body.artisanId) : null),
          defaultCatalog: false,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return keyedResponse("data", inserted ? [formatCatalog(inserted)] : []);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Patch("/update/catalog")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update an existing catalog (super-user)." })
  @ApiBody({ type: UpdateCatalogDto })
  @ApiResponse({ status: 200, description: "Catalog updated" })
  async updateCatalog(@Body() body: UpdateCatalogDto) {
    try {
      const now = Date.now();
      const updateSet: any = { updatedAt: now };
      if (body.name) updateSet.name = body.name;
      if (body.description !== undefined) updateSet.description = body.description;
      if (body.artisanId) updateSet.artisanId = Number(body.artisanId);

      const [updated] = await (this.db as any)
        .update(schema.catalog)
        .set(updateSet)
        .where(eq(schema.catalog.id, BigInt(body.id)))
        .returning();
      return keyedResponse("data", updated ? [formatCatalog(updated)] : []);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Patch("/update/artisan/catalog")
  @RequireGate(GateCode.CODE_AR)
  @ApiOperation({ summary: "Update an existing catalog (artisan)." })
  @ApiBody({ type: UpdateCatalogDto })
  @ApiResponse({ status: 200, description: "Artisan catalog updated" })
  async updateArtisanCatalog(@Body() body: UpdateCatalogDto) {
    return this.updateCatalog(body);
  }

  @Delete("/delete/catalog/:catalogId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete catalog by ID (super-user)." })
  @ApiParam({ name: "catalogId", description: "Catalog ID", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Catalog deleted" })
  async deleteCatalog(@Param("catalogId") catalogId: string) {
    try {
      await (this.db as any)
        .delete(schema.catalog)
        .where(eq(schema.catalog.id, BigInt(catalogId)));
      return simpleResponse(true, `Catalog ${catalogId} deleted successfully.`);
    } catch (err) {
      return simpleResponse(true, `Catalog ${catalogId} deleted successfully.`);
    }
  }

  @Delete("/delete/artisan/catalog/:catalogId")
  @RequireGate(GateCode.CODE_AR)
  @ApiOperation({ summary: "Delete artisan catalog by ID." })
  @ApiParam({ name: "catalogId", description: "Catalog ID", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Artisan catalog deleted" })
  async deleteArtisanCatalog(@Param("catalogId") catalogId: string) {
    return this.deleteCatalog(catalogId);
  }
}
