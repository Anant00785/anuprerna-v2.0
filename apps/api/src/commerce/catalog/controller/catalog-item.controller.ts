// @ts-nocheck
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { CatalogItemService } from "../service/catalog-item.service.js";

@Controller()
@ApiTags("Catalog")
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class CatalogItemController {
  constructor(private readonly catalogItemService: CatalogItemService) {}

  @Get("/get/catalog-item/:catalogItemId")
  @RequireGate(GateCode.CODE_SU)
  async getCatalogItem(@Param('catalogItemId') id: string) {
    return keyedResponse("catalogItem", await this.catalogItemService.findById(BigInt(id)));
  }

  @Get("/get/catalog-item-list")
  @RequireGate(GateCode.CODE_SU)
  async getCatalogItemList() {
    return keyedResponse("catalogItemList", await this.catalogItemService.findAll());
  }

  @Get("/get/artisan/catalog-item/:catalogItemId")
  @RequireGate(GateCode.CODE_AR)
  async getArtisanCatalogItem(@Param('catalogItemId') id: string) {
    return keyedResponse("catalogItem", await this.catalogItemService.findById(BigInt(id)));
  }

  @Post("/add/catalog-item")
  @RequireGate(GateCode.CODE_SU)
  async addCatalogItem(@Body() body: unknown) {
    await this.catalogItemService.create(body);
    return simpleResponse(true, "Created successfully.");
  }

  @Post("/add/artisan/catalog-item")
  @RequireGate(GateCode.CODE_AR)
  async addArtisanCatalogItem(@Body() body: unknown) {
    await this.catalogItemService.create(body);
    return simpleResponse(true, "Created successfully.");
  }

  @Patch("/update/catalog-item")
  @RequireGate(GateCode.CODE_SU)
  async updateCatalogItem(@Body() body: unknown) {
    await this.catalogItemService.update(body);
    return simpleResponse(true, "Updated successfully.");
  }

  @Patch("/update/artisan/catalog-item")
  @RequireGate(GateCode.CODE_AR)
  async updateArtisanCatalogItem(@Body() body: unknown) {
    await this.catalogItemService.update(body);
    return simpleResponse(true, "Updated successfully.");
  }

  @Delete("/delete/catalog-item/:catalogItemId")
  @RequireGate(GateCode.CODE_SU)
  async deleteCatalogItem(@Param('catalogItemId') id: string) {
    await this.catalogItemService.delete(BigInt(id));
    return simpleResponse(true, "Deleted successfully.");
  }

  @Delete("/delete/artisan/catalog-item-media/:catalogItemMediaId")
  @RequireGate(GateCode.CODE_AR)
  async deleteArtisanCatalogItemMedia(@Param('catalogItemMediaId') id: string) {
    return simpleResponse(true, "Deleted successfully.");
  }
}
// @ts-nocheck
