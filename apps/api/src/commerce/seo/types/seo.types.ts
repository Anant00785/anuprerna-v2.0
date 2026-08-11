// @ts-nocheck
export interface ProductSEO {
    id: bigint;
    name: string;
    metaTitle: string;
    metaDescription: string;
    slug: string;
    sku: string;
    productGroup: string;
}

export interface ArticleSEO {
    id: bigint;
    slug: string;
    articleType: string;
}

export interface FilterSEO {
    name: string;
    metaTitle: string;
    metaDescription: string;
    iconImage: string;
    socialImage: string;
}

export interface ProductImageGallerySEOData {
    id: bigint;
    version: bigint;
    productId: bigint;
    image: string;
    altText: string;
}

export interface ProductImageData {
    productId: bigint;
    slug: string;
    heroImage: string;
    additionalImages: string;
}

export interface ProductImageGallerySEO {
    id: bigint;
    version: bigint;
    productId: bigint;
    image: string;
    altText: string;
    deleted?: boolean;
}
// @ts-nocheck
// @ts-nocheck
