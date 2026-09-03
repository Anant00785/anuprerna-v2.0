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
  async addArtisanCatalogPdfGeneration(@CurrentTenant() tenant: AuthenticatedTenant, @Body() body: GenerateCatalogPdfDto) {
    const result = await this.catalogPdfService.create(tenant.id, body);
    return keyedResponse("catalogPdfGeneration", result);
  }

  @Get("/get/artisan/catalog-pdf-generation-list")
  @ApiOperation({ summary: "List catalog PDF generation requests for artisan." })
  @RequireGate(GateCode.CODE_AR)
  async getArtisanCatalogPdfGenerationList(@CurrentTenant() tenant: AuthenticatedTenant) {
    const list = await this.catalogPdfService.findByArtisan(tenant.id);
    return keyedResponse("catalogPdfGenerationList", list);
  }

  @Get("/get/artisan/catalog-pdf-generation/:generationId")
  @ApiOperation({ summary: "Get catalog PDF generation status for artisan." })
  @ApiParam({ name: "generationId", description: "Generation ID", example: 123615651, type: Number })
  @RequireGate(GateCode.CODE_AR)
  async getArtisanCatalogPdfGeneration(@Param('generationId') id: string) {
    return keyedResponse("catalogPdfGeneration", await this.catalogPdfService.findById(BigInt(id)));
  }

  @Get("/wait/artisan/catalog-pdf-generation/:generationId")
  @ApiOperation({ summary: "Wait for catalog PDF generation for artisan." })
  @ApiParam({ name: "generationId", description: "Generation ID", example: 123615651, type: Number })
  @RequireGate(GateCode.CODE_AR)
  async waitArtisanCatalogPdfGeneration(@Param('generationId') id: string) {
    return keyedResponse("catalogPdfGeneration", await this.catalogPdfService.findById(BigInt(id)));
  }

  @Post("/add/catalog-pdf-generation/artisan/:artisanId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Generate catalog PDF by artisan ID (super-user)." })
  @ApiParam({ name: "artisanId", description: "Artisan ID", example: 101, type: Number })
  @ApiBody({ type: GenerateCatalogPdfDto })
  async addCatalogPdfGenerationByArtisan(@Param('artisanId') artisanId: string, @Body() body: GenerateCatalogPdfDto) {
    const result = await this.catalogPdfService.create(BigInt(artisanId), body);
    return keyedResponse("catalogPdfGeneration", result);
  }

  @Get("/get/catalog-pdf-generation-list/artisan/:artisanId")
  @ApiOperation({ summary: "List catalog PDF generation requests for an artisan (super-user)." })
  @ApiParam({ name: "artisanId", description: "Artisan ID", example: 101, type: Number })
  @RequireGate(GateCode.CODE_SU)
  async getCatalogPdfGenerationListByArtisan(@Param('artisanId') artisanId: string) {
    const list = await this.catalogPdfService.findByArtisan(BigInt(artisanId));
    return keyedResponse("catalogPdfGenerationList", list);
  }

  @Get("/get/catalog-pdf-generation/:generationId")
  @ApiOperation({ summary: "Get catalog PDF generation status (super-user)." })
  @ApiParam({ name: "generationId", description: "Generation ID", example: 123615651, type: Number })
  @RequireGate(GateCode.CODE_SU)
  async getCatalogPdfGeneration(@Param('generationId') id: string) {
    return keyedResponse("catalogPdfGeneration", await this.catalogPdfService.findById(BigInt(id)));
  }

  @Get("/wait/catalog-pdf-generation/:generationId")
  @ApiOperation({ summary: "Wait for catalog PDF generation (super-user)." })
  @ApiParam({ name: "generationId", description: "Generation ID", example: 123615651, type: Number })
  @RequireGate(GateCode.CODE_SU)
  async waitCatalogPdfGeneration(@Param('generationId') id: string) {
    return keyedResponse("catalogPdfGeneration", await this.catalogPdfService.findById(BigInt(id)));
  }
}
