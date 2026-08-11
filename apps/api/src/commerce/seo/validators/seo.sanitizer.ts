import { ProductImageGallerySEOPayload } from "../dto/seo.dto.js";

function escapeHtml(str: string): string {
    if (!str) return str;
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
}

export function sanitizeProductImageGallerySEOPayload(input: ProductImageGallerySEOPayload): ProductImageGallerySEOPayload {
    return {
        ...input,
        gallerySEOList: input.gallerySEOList.map(item => ({
            ...item,
            image: item.image ? item.image.trim() : "",
            altText: item.altText ? escapeHtml(item.altText.trim()) : ""
        }))
    };
}
