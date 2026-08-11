// @ts-nocheck
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { CatalogItemMediaService } from "../service/catalog-item-media.service.js";

@Controller()
@ApiTags("Catalog")
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class CatalogItemMediaController {
  constructor(private readonly catalogItemMediaService: CatalogItemMediaService) {}

  @Post("/add/catalog-item-media")
  @RequireGate(GateCode.CODE_SU)
  async addCatalogItemMedia(@Body() body: unknown) {
    await this.catalogItemMediaService.create(body);
    return simpleResponse(true, "Created successfully.");
  }

  @Delete("/delete/catalog-item-media/:catalogItemMediaId")
  @RequireGate(GateCode.CODE_SU)
  async deleteCatalogItemMedia(@Param('catalogItemMediaId') id: string) {
    await this.catalogItemMediaService.delete(BigInt(id));
    return simpleResponse(true, "Deleted successfully.");
  }
}
// @ts-nocheck
