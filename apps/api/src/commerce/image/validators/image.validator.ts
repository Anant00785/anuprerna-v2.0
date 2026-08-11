// @ts-nocheck
/**
 * migrated/image/validators/image.validator.ts
 *
 * Ports Java's ImageValidator (checks MIME type and file size).
 */
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "../types/image.types.js";

export function validateImageFile(
  mimetype: string | undefined,
  size: number | undefined,
): string | null {
  if (!mimetype || !ALLOWED_MIME_TYPES.has(mimetype)) {
    return `Invalid file type. Allowed types: ${[...ALLOWED_MIME_TYPES].join(", ")}`;
  }
  if (size !== undefined && size > MAX_FILE_SIZE_BYTES) {
    return `File too large. Max size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`;
  }
  return null;
}

export function validateImageUrl(url: string | undefined): string | null {
  if (!url || url.trim().length === 0) return "Image URL is required";
  return null;
}
// @ts-nocheck
// @ts-nocheck
