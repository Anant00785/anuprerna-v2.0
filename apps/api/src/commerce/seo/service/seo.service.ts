import { Injectable } from "@nestjs/common";
import { ActionCode } from "../../../common/errors/action-code.js";
import { SeoRepository } from "../repository/seo.repository.js";
import { 
    ProductSEO, 
    ArticleSEO, 
    FilterSEO, 
    ProductImageGallerySEOData, 
    ProductImageData
} from "../types/seo.types.js";
import { ProductImageGallerySEOPayload } from "../dto/seo.dto.js";

@Injectable()
export class SeoService {
    constructor(private readonly seoRepository: SeoRepository) {}

    async getProductSeoList(): Promise<ProductSEO[]> {
        return this.seoRepository.retrieveProductSEOList();
    }

    async getArticleSeoList(): Promise<ArticleSEO[]> {
        return this.seoRepository.retrieveArticleSEOList();
    }

    async getFilterSeo(code: string, name: string): Promise<FilterSEO | null> {
        return this.seoRepository.retrieveFilterSEO(code, name);
    }

    async getProductImageGallerySEOData(page: number, size: number): Promise<ProductImageGallerySEOData[]> {
        return this.seoRepository.retrieveProductImageGallerySEOData(page, size);
    }

    async updateGalleryImages(payload: ProductImageGallerySEOPayload): Promise<number> {
        try {
            const productExists = await this.seoRepository.checkProductExists(payload.productId);
            if (!productExists) {
                return ActionCode.INCORRECT_INFORMATION;
            }

            for (const image of payload.gallerySEOList) {
                if (image.deleted) {
                    if (image.id && Number(image.id) > 0) {
                        await this.seoRepository.deleteProductImageGallerySEO(BigInt(image.id));
                    }
                } else {
                    if (image.id && Number(image.id) > 0) {
                        await this.seoRepository.updateProductImageGallerySEO(BigInt(image.id), image.image, image.altText);
                    } else {
                        await this.seoRepository.insertProductImageGallerySEO(payload.productId, image.image, image.altText);
                    }
                }
            }

            return ActionCode.UPDATE_SUCCESS;
        } catch (err) {
            console.error("updateGalleryImages error:", err);
            return ActionCode.NO_ACTION;
        }
    }

    async getProductImageSitemapData(): Promise<ProductImageData[]> {
        return this.seoRepository.retrieveProductImageData();
    }

    async getEnabledProductImageSitemapData(): Promise<ProductImageData[]> {
        return this.seoRepository.retrieveEnabledProductImageData();
    }
}
