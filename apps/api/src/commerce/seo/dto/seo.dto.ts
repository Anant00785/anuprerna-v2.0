// @ts-nocheck
import { ProductImageGallerySEO } from "../types/seo.types.js";

export interface ProductImageGallerySEOPayload {
    productId: bigint;
    gallerySEOList: ProductImageGallerySEO[];
}

export function parseProductImageGallerySEOPayload(raw: unknown): ProductImageGallerySEOPayload {
    const obj = raw as Record<string, unknown>;
    
    let gallerySEOList: ProductImageGallerySEO[] = [];
    if (Array.isArray(obj.gallerySEOList)) {
        gallerySEOList = obj.gallerySEOList.map((item: any) => ({
            id: typeof item.id === "string" || typeof item.id === "number" || typeof item.id === "bigint" ? BigInt(item.id) : 0n,
            version: typeof item.version === "string" || typeof item.version === "number" || typeof item.version === "bigint" ? BigInt(item.version) : 0n,
            productId: typeof item.productId === "string" || typeof item.productId === "number" || typeof item.productId === "bigint" ? BigInt(item.productId) : 0n,
            image: typeof item.image === "string" ? item.image : "",
            altText: typeof item.altText === "string" ? item.altText : "",
            deleted: typeof item.deleted === "boolean" ? item.deleted : false
        }));
    }

    return {
        productId: typeof obj.productId === "string" || typeof obj.productId === "number" || typeof obj.productId === "bigint" ? BigInt(obj.productId) : 0n,
        gallerySEOList
    };
}
// @ts-nocheck
// @ts-nocheck
