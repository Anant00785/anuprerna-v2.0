// @ts-nocheck
import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { eq, and, sql, desc, asc, like, or, inArray, isNull, isNotNull, between, gte, lte } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { 
    ProductSEO, 
    ArticleSEO, 
    FilterSEO, 
    ProductImageGallerySEOData, 
    ProductImageGallerySEO,
    ProductImageData
} from "../types/seo.types.js";

@Injectable()
export class SeoRepository {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
    ) {}

    async retrieveProductSEOList(): Promise<ProductSEO[]> {
        const rows = await this.db.select({
            id: schema.product.id,
            name: schema.product.name,
            metaTitle: schema.product.metaTitle,
            metaDescription: schema.product.metaDescription,
            slug: schema.product.slug,
            sku: schema.product.sku,
            productGroup: schema.product.productGroup
        }).from(schema.product).limit(500);

        return rows.map(r => ({
            id: typeof r.id === "bigint" ? Number(r.id) : (r.id ? Number(r.id) : null),
            name: r.name || '',
            metaTitle: r.metaTitle || '',
            metaDescription: r.metaDescription || '',
            slug: r.slug || '',
            sku: r.sku || '',
            productGroup: r.productGroup || ''
        }));
    }

    async retrieveArticleSEOList(): Promise<ArticleSEO[]> {
        // Find Blog Content SEO
        const blogRows = await this.db.select({
            id: schema.blogContent.id,
            slug: schema.blogContent.slug,
        }).from(schema.blogContent);

        // Find Story Content SEO
        const storyRows = await this.db.select({
            id: schema.storyContent.id,
            slug: schema.storyContent.slug,
        }).from(schema.storyContent);

        const articles: ArticleSEO[] = [];
        
        for (const b of blogRows) {
            articles.push({
                id: typeof b.id === "bigint" ? Number(b.id) : (b.id ? Number(b.id) : null),
                slug: b.slug || '',
                articleType: "BLOG"
            });
        }
        
        for (const s of storyRows) {
            articles.push({
                id: typeof s.id === "bigint" ? Number(s.id) : (s.id ? Number(s.id) : null),
                slug: s.slug || '',
                articleType: "STORY"
            });
        }
        
        return articles;
    }

    async retrieveFilterSEO(code: string, name: string): Promise<FilterSEO | null> {
        let row = null;

        if (code === "CAT") {
            const results = await this.db.select().from(schema.category).where(sql`LOWER(${schema.category.name}) = LOWER(${name})`);
            row = results[0];
        } else if (code === "SEG") {
            const results = await this.db.select().from(schema.segment).where(sql`LOWER(${schema.segment.name}) = LOWER(${name})`);
            row = results[0];
        } else if (code === "SUB") {
            const results = await this.db.select().from(schema.subCategory).where(sql`LOWER(${schema.subCategory.name}) = LOWER(${name})`);
            row = results[0];
        }

        if (row) {
            return {
                name: row.name || '',
                metaTitle: row.metaTitle || '',
                metaDescription: row.metaDescription || '',
                iconImage: row.icon || '',
                socialImage: row.socialImage || ''
            };
        }
        
        return null;
    }

    async retrieveProductImageGallerySEOData(page: number, size: number): Promise<ProductImageGallerySEOData[]> {
        const offset = page * size;
        const rows = await this.db.select()
            .from(schema.productImageGallerySeo)
            .limit(size)
            .offset(offset);
            
        return rows.map(r => ({
            id: typeof r.id === "bigint" ? Number(r.id) : (r.id ? Number(r.id) : null),
            version: typeof r.version === "bigint" ? Number(r.version) : (r.version ? Number(r.version) : 0),
            productId: typeof r.productId === "bigint" ? Number(r.productId) : (r.productId ? Number(r.productId) : null),
            image: r.image || '',
            altText: r.altText || ''
        }));
    }

    async deleteProductImageGallerySEO(id: bigint): Promise<void> {
        await this.db.delete(schema.productImageGallerySeo).where(eq(schema.productImageGallerySeo.id, id));
    }

    async updateProductImageGallerySEO(id: bigint, image: string, altText: string): Promise<void> {
        await this.db.update(schema.productImageGallerySeo)
            .set({ image, altText })
            .where(eq(schema.productImageGallerySeo.id, id));
    }

    async insertProductImageGallerySEO(productId: bigint | number, image: string, altText: string): Promise<void> {
        const prodId = typeof productId === "bigint" ? Number(productId) : Number(productId);
        await this.db.insert(schema.productImageGallerySeo)
            .values({
                productId: prodId as any,
                image,
                altText
            })
            .onConflictDoUpdate({
                target: [schema.productImageGallerySeo.productId, schema.productImageGallerySeo.image],
                set: { altText }
            });
    }

    async checkProductExists(productId: bigint | number): Promise<boolean> {
        const prodId = typeof productId === "bigint" ? productId : BigInt(productId);
        const rows = await this.db.select({ id: schema.product.id })
            .from(schema.product)
            .where(eq(schema.product.id, prodId))
            .limit(1);
        return rows.length > 0;
    }

    async retrieveProductImageData(): Promise<ProductImageData[]> {
        const rows = await this.db.select({
            id: schema.product.id,
            slug: schema.product.slug,
            heroImage: schema.product.heroImage,
            galleryImages: schema.product.galleryImages
        }).from(schema.product).limit(500);

        return rows.map(r => ({
            productId: typeof r.id === "bigint" ? Number(r.id) : (r.id ? Number(r.id) : null),
            slug: r.slug || '',
            heroImage: r.heroImage || '',
            galleryImages: r.galleryImages || ''
        }));
    }

    async retrieveEnabledProductImageData(): Promise<ProductImageData[]> {
        const rows = await this.db.select({
            id: schema.product.id,
            slug: schema.product.slug,
            heroImage: schema.product.heroImage,
            galleryImages: schema.product.galleryImages
        })
        .from(schema.product)
        .where(eq(schema.product.disabled, false))
        .limit(500);

        return rows.map(r => ({
            productId: typeof r.id === "bigint" ? Number(r.id) : (r.id ? Number(r.id) : null),
            slug: r.slug || '',
            heroImage: r.heroImage || '',
            galleryImages: r.galleryImages || ''
        }));
    }
}
