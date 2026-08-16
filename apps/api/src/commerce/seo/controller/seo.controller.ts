// @ts-nocheck
import { Controller, Get, Post, Param, Query, Body, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { ActionCode } from "../../../common/errors/action-code.js";
import { SeoService } from "../service/seo.service.js";
import { ModifyGalleryImagesDto, parseProductImageGallerySEOPayload } from "../dto/seo.dto.js";
import { validateProductImageGallerySEOPayload } from "../validators/seo.validator.js";
import { sanitizeProductImageGallerySEOPayload } from "../validators/seo.sanitizer.js";

@Controller()
@ApiTags("SEO")
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class SeoController {
    constructor(private readonly seoService: SeoService) {}

    @Get("/get/product-seo-list")
    @ApiOperation({ summary: "Get all products SEO metadata." })
    @ApiResponse({ status: 200, description: "Product SEO list." })
    async getProductSeoList() {
        const result = await this.seoService.getProductSeoList();
        return keyedResponse("entityList", result);
    }

    @Get("/get/article-seo-list")
    @ApiOperation({ summary: "Get all articles (blogs & stories) SEO metadata." })
    @ApiResponse({ status: 200, description: "Article SEO list." })
    async getArticleSeoList() {
        const result = await this.seoService.getArticleSeoList();
        return keyedResponse("entityList", result);
    }

    @Get("/get/filter-seo/:code/:name")
    @ApiOperation({ summary: "Get filter SEO metadata by filter code and name." })
    @ApiParam({ name: "code", description: "Filter code (CAT, SEG, SUB)", example: "CAT" })
    @ApiParam({ name: "name", description: "Filter name (e.g. Fabric)", example: "Fabric" })
    @ApiResponse({ status: 200, description: "Filter SEO metadata." })
    async getFilterSeo(
        @Param("code") code: string,
        @Param("name") name: string
    ) {
        const result = await this.seoService.getFilterSeo(code, name);
        return keyedResponse("entity", result);
    }

    @Get("/get/table-explorer/data/product-image-gallery-seo")
    @RequireGate(GateCode.CODE_SU)
    @ApiOperation({ summary: "Get paginated product image gallery SEO data." })
    @ApiQuery({ name: "page", required: false, type: Number, example: 0, description: "Page index" })
    @ApiQuery({ name: "size", required: false, type: Number, example: 10, description: "Page size" })
    @ApiResponse({ status: 200, description: "Gallery SEO list." })
    async getProductImageGallerySEOData(
        @Query("page") pageStr: string = "0",
        @Query("size") sizeStr: string = "10"
    ) {
        const page = parseInt(pageStr, 10) || 0;
        const size = parseInt(sizeStr, 10) || 10;
        const result = await this.seoService.getProductImageGallerySEOData(page, size);
        return keyedResponse("entityList", result);
    }

    @Post("/modify/gallery-images")
    @RequireGate(GateCode.CODE_SUCU)
    @ApiOperation({ summary: "Create/update/delete product gallery image SEO metadata." })
    @ApiBody({ type: ModifyGalleryImagesDto })
    @ApiResponse({ status: 201, description: "Gallery images updated successfully." })
    async updateGalleryImages(@Body() rawPayload: ModifyGalleryImagesDto) {
        const parsed = parseProductImageGallerySEOPayload(rawPayload);
        
        const validationError = validateProductImageGallerySEOPayload(parsed);
        if (validationError) {
            return simpleResponse(false, validationError);
        }

        const sanitized = sanitizeProductImageGallerySEOPayload(parsed);
        const actionResult = await this.seoService.updateGalleryImages(sanitized);
        
        if (actionResult === ActionCode.INCORRECT_INFORMATION) {
            return simpleResponse(false, "Incorrect information provided.");
        }
        
        if (actionResult === ActionCode.UPDATE_SUCCESS) {
            return simpleResponse(true, "New gallery image created/updated successfully.");
        }
        
        return simpleResponse(false, "Failed to update gallery images.");
    }

    @Get("/get/product/image-sitemap")
    @ApiOperation({ summary: "Get product image sitemap dataset." })
    @ApiResponse({ status: 200, description: "Product image sitemap dataset." })
    async getProductImageSitemapData() {
        const result = await this.seoService.getProductImageSitemapData();
        return keyedResponse("entityList", result);
    }

    @Get("/get/product/enabled-image-sitemap")
    @ApiOperation({ summary: "Get enabled active products image sitemap dataset." })
    @ApiResponse({ status: 200, description: "Active products image sitemap dataset." })
    async getEnabledProductImageSitemapData() {
        const result = await this.seoService.getEnabledProductImageSitemapData();
        return keyedResponse("entityList", result);
    }
}
