// @ts-nocheck
import { ApiBearerAuth } from "@nestjs/swagger";
import { Controller, Get, UseGuards } from '@nestjs/common';
import { SitemapService } from '../service/sitemap.service.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import { keyedResponse } from '../../../common/response/rain-response.js';

@ApiBearerAuth()
@Controller('get/product')
@UseGuards(RolesGuard)
export class SitemapController {
    constructor(private readonly service: SitemapService) {}

    @Get('image-sitemap')
    @RequireGate(GateCode.PUBLIC)
    async getProductImageSitemapData() {
        const data = await this.service.getProductImageSitemapData();
        return keyedResponse('sitemapData', data);
    }

    @Get('enabled-image-sitemap')
    @RequireGate(GateCode.PUBLIC)
    async getEnabledProductImageSitemapData() {
        const data = await this.service.getEnabledProductImageSitemapData();
        return keyedResponse('sitemapData', data);
    }
}
