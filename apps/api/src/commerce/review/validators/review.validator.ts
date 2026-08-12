import { ReviewInput } from "../dto/review.dto.js";

export function validateReview(input: ReviewInput): string | null {
  if (input.rating === undefined || input.rating < 1 || input.rating > 5) return "Rating must be between 1 and 5.";
  if (!input.name || input.name.trim().length === 0 || input.name.length > 255) return "Name must be between 1 and 255 characters.";
  if (!input.country || input.country.trim().length === 0 || input.country.length > 255) return "Country must be between 1 and 255 characters.";
  if (input.city !== undefined && input.city.length > 255) return "City must be <= 255 characters.";
  if (input.description !== undefined && input.description.length > 5000) return "Description must be <= 5000 characters.";
  if (input.link !== undefined && input.link.length > 2000) return "Link must be <= 2000 characters.";
  if (input.productImages !== undefined && input.productImages.length > 5000) return "Product images must be <= 5000 characters.";
  if ((input as any).activeUrl !== undefined && (input as any).activeUrl?.length > 2000) return "Active URL must be <= 2000 characters.";
  return null;
}

export function validateReviewStatus(input: ReviewInput): string | null {
  const validStatuses = ["PENDING", "APPROVED", "REMOVED"];
  if (!input.status || !validStatuses.includes(input.status)) return "Invalid review status.";
  return null;
}
