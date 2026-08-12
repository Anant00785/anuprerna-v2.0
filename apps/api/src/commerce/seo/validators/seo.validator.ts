import { ProductImageGallerySEOPayload } from "../dto/seo.dto.js";

export function validateProductImageGallerySEOPayload(input: ProductImageGallerySEOPayload): string | null {
    if (!input.productId) {
        return "Product ID is required.";
    }
    
    if (input.gallerySEOList) {
        for (const item of input.gallerySEOList) {
            if (!item.deleted) {
                if (!item.image || item.image.trim() === "") {
                    return "Image URL is required for gallery SEO records.";
                }
                if (!item.altText || item.altText.trim() === "") {
                    return "Alt text is required for gallery SEO records.";
                }
            }
        }
    }
    
    return null;
}
