// @ts-nocheck
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { CatalogService } from "../service/catalog.service.js";
import { CreateCatalogDto, UpdateCatalogDto } from "../dto/catalog.dto.js";

@Controller()
@ApiTags("Catalog")
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("/get/catalog/:catalogId")
  @ApiOperation({ summary: "Retrieve a catalog by ID (super-user)." })
  @ApiParam({ name: "catalogId", description: "Catalog ID", example: 1, type: Number })
  async getCatalog(@Param('catalogId') catalogId: string) {
    return keyedResponse("catalog", await this.catalogService.findById(BigInt(catalogId)));
  }

  @Get("/get/catalog-list")
  @ApiOperation({ summary: "List all catalogs." })
  async getCatalogList() {
    return keyedResponse("catalogList", await this.catalogService.findAll());
  }

  @Get("/get/catalog-list/artisan/:artisanId")
  @ApiOperation({ summary: "List catalogs by artisan ID." })
  @ApiParam({ name: "artisanId", description: "Artisan ID", example: 101, type: Number })
  async getCatalogListByArtisan(@Param('artisanId') artisanId: string) {
    return keyedResponse("catalogList", await this.catalogService.findByArtisan(BigInt(artisanId)));
  }

  @Get("/get/artisan/catalog/:catalogId")
  @ApiOperation({ summary: "Retrieve an artisan catalog by ID." })
  @ApiParam({ name: "catalogId", description: "Catalog ID", example: 1, type: Number })
  async getArtisanCatalog(@Param('catalogId') catalogId: string) {
    return keyedResponse("catalog", await this.catalogService.findById(BigInt(catalogId)));
  }

  @Get("/get/artisan/catalog-list")
  @ApiOperation({ summary: "List authenticated artisan's catalogs." })
  async getArtisanCatalogList(@CurrentTenant() tenant: AuthenticatedTenant) {
    return keyedResponse("catalogList", await this.catalogService.findByArtisan(tenant.id));
  }

  @Get("/get/recent-catalog-list/:limit")
  @ApiOperation({ summary: "Get recent catalogs list." })
  @ApiParam({ name: "limit", description: "Limit count", example: 10, type: Number })
  async getRecentCatalogList(@Param('limit') limit: number) {
    return keyedResponse("catalogList", await this.catalogService.findRecent(limit));
  }

  @Post("/add/catalog")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Add a new catalog (super-user)." })
  @ApiBody({ type: CreateCatalogDto })
  async addCatalog(@Body() body: unknown) {
    await this.catalogService.create(body);
    return simpleResponse(true, "Created successfully.");
  }

  @Post("/add/artisan/catalog")
  @RequireGate(GateCode.CODE_AR)
  @ApiOperation({ summary: "Add a new catalog (artisan)." })
  @ApiBody({ type: CreateCatalogDto })
  async addArtisanCatalog(@Body() body: unknown) {
    await this.catalogService.create(body);
    return simpleResponse(true, "Created successfully.");
  }

  @Patch("/update/catalog")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update an existing catalog (super-user)." })
  @ApiBody({ type: UpdateCatalogDto })
  async updateCatalog(@Body() body: unknown) {
    await this.catalogService.update(body);
    return simpleResponse(true, "Updated successfully.");
  }

  @Patch("/update/artisan/catalog")
  @RequireGate(GateCode.CODE_AR)
  @ApiOperation({ summary: "Update an existing catalog (artisan)." })
  @ApiBody({ type: UpdateCatalogDto })
  async updateArtisanCatalog(@Body() body: unknown) {
    await this.catalogService.update(body);
    return simpleResponse(true, "Updated successfully.");
  }

  @Delete("/delete/catalog/:catalogId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete catalog by ID (super-user)." })
  @ApiParam({ name: "catalogId", description: "Catalog ID", example: 1, type: Number })
  async deleteCatalog(@Param('catalogId') catalogId: string) {
    await this.catalogService.delete(BigInt(catalogId));
    return simpleResponse(true, "Deleted successfully.");
  }

  @Delete("/delete/artisan/catalog/:catalogId")
  @RequireGate(GateCode.CODE_AR)
  @ApiOperation({ summary: "Delete artisan catalog by ID." })
  @ApiParam({ name: "catalogId", description: "Catalog ID", example: 1, type: Number })
  async deleteArtisanCatalog(@Param('catalogId') catalogId: string) {
    await this.catalogService.delete(BigInt(catalogId));
    return simpleResponse(true, "Deleted successfully.");
  }
}
