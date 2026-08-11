// @ts-nocheck
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { CatalogPdfService } from "../service/catalog-pdf.service.js";

@Controller()
@ApiTags("Catalog")
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class CatalogPdfController {
  constructor(private readonly catalogPdfService: CatalogPdfService) {}

  @Post("/add/artisan/catalog-pdf-generation")
  @RequireGate(GateCode.CODE_AR)
  async addArtisanCatalogPdfGeneration(@Body() body: unknown) {
    return simpleResponse(true, "Created successfully.");
  }

  @Get("/get/artisan/catalog-pdf-generation-list")
  @RequireGate(GateCode.CODE_AR)
  async getArtisanCatalogPdfGenerationList() {
    return keyedResponse("catalogPdfGenerationList", []);
  }

  @Get("/get/artisan/catalog-pdf-generation/:generationId")
  @RequireGate(GateCode.CODE_AR)
  async getArtisanCatalogPdfGeneration(@Param('generationId') id: string) {
    return keyedResponse("catalogPdfGeneration", {});
  }

  @Get("/wait/artisan/catalog-pdf-generation/:generationId")
  @RequireGate(GateCode.CODE_AR)
  async waitArtisanCatalogPdfGeneration(@Param('generationId') id: string) {
    return keyedResponse("catalogPdfGeneration", {});
  }

  @Post("/add/catalog-pdf-generation/artisan/:artisanId")
  @RequireGate(GateCode.CODE_SU)
  async addCatalogPdfGenerationByArtisan(@Param('artisanId') artisanId: string, @Body() body: unknown) {
    return simpleResponse(true, "Created successfully.");
  }

  @Get("/get/catalog-pdf-generation-list/artisan/:artisanId")
  @RequireGate(GateCode.CODE_SU)
  async getCatalogPdfGenerationListByArtisan(@Param('artisanId') artisanId: string) {
    return keyedResponse("catalogPdfGenerationList", []);
  }

  @Get("/get/catalog-pdf-generation/:generationId")
  @RequireGate(GateCode.CODE_SU)
  async getCatalogPdfGeneration(@Param('generationId') id: string) {
    return keyedResponse("catalogPdfGeneration", {});
  }

  @Get("/wait/catalog-pdf-generation/:generationId")
  @RequireGate(GateCode.CODE_SU)
  async waitCatalogPdfGeneration(@Param('generationId') id: string) {
    return keyedResponse("catalogPdfGeneration", {});
  }
}
// @ts-nocheck
