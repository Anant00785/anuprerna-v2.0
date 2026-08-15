// @ts-nocheck
import { Controller, Get, Post, Param, Query, Body, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { ActionCode } from "../../../common/errors/action-code.js";
import { SeoService } from "../service/seo.service.js";
import { parseProductImageGallerySEOPayload } from "../dto/seo.dto.js";
import { validateProductImageGallerySEOPayload } from "../validators/seo.validator.js";
import { sanitizeProductImageGallerySEOPayload } from "../validators/seo.sanitizer.js";

@Controller()
@ApiTags("SEO")
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class SeoController {
    constructor(private readonly seoService: SeoService) {}

    @Get("/get/product-seo-list")
    async getProductSeoList() {
        const result = await this.seoService.getProductSeoList();
        return keyedResponse("entityList", result);
    }

    @Get("/get/article-seo-list")
    async getArticleSeoList() {
        const result = await this.seoService.getArticleSeoList();
        return keyedResponse("entityList", result);
    }

    @Get("/get/filter-seo/:code/:name")
    async getFilterSeo(
        @Param("code") code: string,
        @Param("name") name: string
    ) {
        const result = await this.seoService.getFilterSeo(code, name);
        return keyedResponse("entity", result);
    }

    @Get("/get/table-explorer/data/product-image-gallery-seo")
  @RequireGate(GateCode.CODE_SU)
    async getProductImageGallerySEOData(
        @Query("page") pageStr: string,
        @Query("size") sizeStr: string
    ) {
        const page = parseInt(pageStr, 10) || 0;
        const size = parseInt(sizeStr, 10) || 10;
        const result = await this.seoService.getProductImageGallerySEOData(page, size);
        return keyedResponse("entityList", result);
    }

    @Post("/modify/gallery-images")
    @RequireGate(GateCode.CODE_SUCU)
    async updateGalleryImages(@Body() rawPayload: unknown) {
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
    async getProductImageSitemapData() {
        const result = await this.seoService.getProductImageSitemapData();
        return keyedResponse("entityList", result);
    }

    @Get("/get/product/enabled-image-sitemap")
    async getEnabledProductImageSitemapData() {
        const result = await this.seoService.getEnabledProductImageSitemapData();
        return keyedResponse("entityList", result);
    }
}
// @ts-nocheck
