export interface ProductSEO {
    id: number;
    name: string;
    metaTitle: string;
    metaDescription: string;
    slug: string;
    sku: string;
    productGroup: string;
}

export interface ArticleSEO {
    id: number;
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
    id: number;
    version: number;
    productId: number;
    image: string;
    altText: string;
}

export interface ProductImageData {
    productId: number;
    slug: string;
    heroImage: string;
    galleryImages: string;
}

export interface ProductImageGallerySEO {
    id: number;
    version: number;
    productId: number;
    image: string;
    altText: string;
    deleted?: boolean;
}
