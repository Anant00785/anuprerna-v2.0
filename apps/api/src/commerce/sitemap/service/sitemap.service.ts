// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { SitemapRepository } from '../repository/sitemap.repository.js';

@Injectable()
export class SitemapService {
    constructor(private readonly repository: SitemapRepository) {}

    async getProductImageSitemapData() {
        return await this.repository.retrieveProductImageData();
    }

    async getEnabledProductImageSitemapData() {
        return await this.repository.retrieveEnabledProductImageData();
    }
}
// @ts-nocheck
