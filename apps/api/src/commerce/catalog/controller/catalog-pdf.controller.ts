// @ts-nocheck
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { CatalogPdfService } from "../service/catalog-pdf.service.js";
import { GenerateCatalogPdfDto } from "../dto/catalog.dto.js";

@Controller()
@ApiTags("Catalog")
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class CatalogPdfController {
  constructor(private readonly catalogPdfService: CatalogPdfService) {}

  @Post("/add/artisan/catalog-pdf-generation")
  @RequireGate(GateCode.CODE_AR)
  @ApiOperation({ summary: "Generate catalog PDF for artisan." })
  @ApiBody({ type: GenerateCatalogPdfDto })
  async addArtisanCatalogPdfGeneration(@Body() body: unknown) {
    return simpleResponse(true, "Created successfully.");
  }

  @Get("/get/artisan/catalog-pdf-generation-list")
  @ApiOperation({ summary: "List catalog PDF generation requests for artisan." })
  async getArtisanCatalogPdfGenerationList() {
    return keyedResponse("catalogPdfGenerationList", []);
  }

  @Get("/get/artisan/catalog-pdf-generation/:generationId")
  @ApiOperation({ summary: "Get catalog PDF generation status for artisan." })
  @ApiParam({ name: "generationId", description: "Generation ID", example: 1, type: Number })
  async getArtisanCatalogPdfGeneration(@Param('generationId') id: string) {
    return keyedResponse("catalogPdfGeneration", {});
  }

  @Get("/wait/artisan/catalog-pdf-generation/:generationId")
  @ApiOperation({ summary: "Wait for catalog PDF generation for artisan." })
  @ApiParam({ name: "generationId", description: "Generation ID", example: 1, type: Number })
  async waitArtisanCatalogPdfGeneration(@Param('generationId') id: string) {
    return keyedResponse("catalogPdfGeneration", {});
  }

  @Post("/add/catalog-pdf-generation/artisan/:artisanId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Generate catalog PDF by artisan ID (super-user)." })
  @ApiParam({ name: "artisanId", description: "Artisan ID", example: 101, type: Number })
  @ApiBody({ type: GenerateCatalogPdfDto })
  async addCatalogPdfGenerationByArtisan(@Param('artisanId') artisanId: string, @Body() body: unknown) {
    return simpleResponse(true, "Created successfully.");
  }

  @Get("/get/catalog-pdf-generation-list/artisan/:artisanId")
  @ApiOperation({ summary: "List catalog PDF generation requests for an artisan (super-user)." })
  @ApiParam({ name: "artisanId", description: "Artisan ID", example: 101, type: Number })
  async getCatalogPdfGenerationListByArtisan(@Param('artisanId') artisanId: string) {
    return keyedResponse("catalogPdfGenerationList", []);
  }

  @Get("/get/catalog-pdf-generation/:generationId")
  @ApiOperation({ summary: "Get catalog PDF generation status (super-user)." })
  @ApiParam({ name: "generationId", description: "Generation ID", example: 1, type: Number })
  async getCatalogPdfGeneration(@Param('generationId') id: string) {
    return keyedResponse("catalogPdfGeneration", {});
  }

  @Get("/wait/catalog-pdf-generation/:generationId")
  @ApiOperation({ summary: "Wait for catalog PDF generation (super-user)." })
  @ApiParam({ name: "generationId", description: "Generation ID", example: 1, type: Number })
  async waitCatalogPdfGeneration(@Param('generationId') id: string) {
    return keyedResponse("catalogPdfGeneration", {});
  }
}
