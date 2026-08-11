// @ts-nocheck
/**
 * migrated/image/types/image.types.ts
 *
 * Ports Java's Image ORM (multipart wrapper), IMAGE_FORMAT enum,
 * and the key service return types.
 */
export enum ImageFormat {
  JPEG = "JPEG",
  PNG = "PNG",
  WEBP = "WEBP",
  GIF = "GIF",
  SVG = "SVG",
  TIFF = "TIFF",
  UNKNOWN = "UNKNOWN",
}

export interface UploadResult {
  url: string;
  format: ImageFormat;
  originalName: string;
}

/** Allowed MIME types — mirrors Java ImageValidator */
export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/tiff",
]);

/** 10 MB max file size */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
// @ts-nocheck
// @ts-nocheck
