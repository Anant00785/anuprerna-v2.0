// @ts-nocheck
import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/database.module.js';
import { sql } from 'drizzle-orm';
import { ProductImageSitemapData } from '../types/sitemap.types.js';

@Injectable()
export class SitemapRepository {
    constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

    async retrieveProductImageData(): Promise<ProductImageSitemapData[]> {
        const query = sql`
            SELECT p.id as "productId", p.slug as "slug", i.url as "imageUrl", i.alt_text as "imageAlt"
            FROM product p
            LEFT JOIN product_image i ON p.id = i.product_id
        `;
        const result = await this.db.execute(query);
        return (result.rows || result) as ProductImageSitemapData[];
    }

    async retrieveEnabledProductImageData(): Promise<ProductImageSitemapData[]> {
        const query = sql`
            SELECT p.id as "productId", p.slug as "slug", i.url as "imageUrl", i.alt_text as "imageAlt"
            FROM product p
            LEFT JOIN product_image i ON p.id = i.product_id
            WHERE p.active = true
        `;
        const result = await this.db.execute(query);
        return (result.rows || result) as ProductImageSitemapData[];
    }
}
// @ts-nocheck
// @ts-nocheck
