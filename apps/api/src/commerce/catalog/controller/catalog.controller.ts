// @ts-nocheck
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { CatalogService } from "../service/catalog.service.js";

@Controller()
@ApiTags("Catalog")
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("/get/catalog/:catalogId")
  @RequireGate(GateCode.CODE_SU)
  async getCatalog(@Param('catalogId') catalogId: string) {
    return keyedResponse("catalog", await this.catalogService.findById(BigInt(catalogId)));
  }

  @Get("/get/catalog-list")
  @RequireGate(GateCode.CODE_SUCU)
  async getCatalogList() {
    return keyedResponse("catalogList", await this.catalogService.findAll());
  }

  @Get("/get/catalog-list/artisan/:artisanId")
  @RequireGate(GateCode.CODE_SUCU)
  async getCatalogListByArtisan(@Param('artisanId') artisanId: string) {
    return keyedResponse("catalogList", await this.catalogService.findByArtisan(BigInt(artisanId)));
  }

  @Get("/get/artisan/catalog/:catalogId")
  @RequireGate(GateCode.CODE_AR)
  async getArtisanCatalog(@Param('catalogId') catalogId: string) {
    return keyedResponse("catalog", await this.catalogService.findById(BigInt(catalogId)));
  }

  @Get("/get/artisan/catalog-list")
  @RequireGate(GateCode.CODE_AR)
  async getArtisanCatalogList(@CurrentTenant() tenant: AuthenticatedTenant) {
    return keyedResponse("catalogList", await this.catalogService.findByArtisan(tenant.id));
  }

  @Get("/get/recent-catalog-list/:limit")
  @RequireGate(GateCode.CODE_SUCU)
  async getRecentCatalogList(@Param('limit') limit: number) {
    return keyedResponse("catalogList", await this.catalogService.findRecent(limit));
  }

  @Post("/add/catalog")
  @RequireGate(GateCode.CODE_SU)
  async addCatalog(@Body() body: unknown) {
    await this.catalogService.create(body);
    return simpleResponse(true, "Created successfully.");
  }

  @Post("/add/artisan/catalog")
  @RequireGate(GateCode.CODE_AR)
  async addArtisanCatalog(@Body() body: unknown) {
    await this.catalogService.create(body);
    return simpleResponse(true, "Created successfully.");
  }

  @Patch("/update/catalog")
  @RequireGate(GateCode.CODE_SU)
  async updateCatalog(@Body() body: unknown) {
    await this.catalogService.update(body);
    return simpleResponse(true, "Updated successfully.");
  }

  @Patch("/update/artisan/catalog")
  @RequireGate(GateCode.CODE_AR)
  async updateArtisanCatalog(@Body() body: unknown) {
    await this.catalogService.update(body);
    return simpleResponse(true, "Updated successfully.");
  }

  @Delete("/delete/catalog/:catalogId")
  @RequireGate(GateCode.CODE_SU)
  async deleteCatalog(@Param('catalogId') catalogId: string) {
    await this.catalogService.delete(BigInt(catalogId));
    return simpleResponse(true, "Deleted successfully.");
  }

  @Delete("/delete/artisan/catalog/:catalogId")
  @RequireGate(GateCode.CODE_AR)
  async deleteArtisanCatalog(@Param('catalogId') catalogId: string) {
    await this.catalogService.delete(BigInt(catalogId));
    return simpleResponse(true, "Deleted successfully.");
  }
}
