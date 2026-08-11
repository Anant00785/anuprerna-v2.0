import { ReviewInput } from "../dto/review.dto.js";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function sanitizeReview(input: ReviewInput): ReviewInput {
  return {
    ...input,
    name: input.name ? escapeHtml(input.name.trim()) : undefined,
    city: input.city ? escapeHtml(input.city.trim()) : undefined,
    country: input.country ? escapeHtml(input.country.trim()) : undefined,
    description: input.description ? escapeHtml(input.description.trim()) : undefined,
    link: input.link ? escapeHtml(input.link.trim()) : undefined,
    productImages: input.productImages ? escapeHtml(input.productImages.trim()) : undefined,
  };
}

export function sanitizeReviewStatus(input: ReviewInput): ReviewInput {
    return { ...input, status: input.status?.trim() };
}
