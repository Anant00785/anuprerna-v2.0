// @ts-nocheck
/**
 * migrated/support/loom-utility.ts
 *
 * Ports Java's LoomUtility class and related constants from the `support` package.
 * The Java support package is purely utility — it has no REST endpoints.
 *
 * Ported helpers:
 *  - buildImageFileName()       — generates a UUID-based filename
 *  - extractFileNameFromUrl()   — strips the filename from a URL
 *  - buildCompatibleSlug()      — normalises a slug (lower, trim, hyphens)
 *  - isEmptyString()            — null/blank check
 */
import * as crypto from "crypto";
import * as path from "path";

/**
 * Generates a unique image filename preserving the original extension.
 * Mirrors Java's LoomUtility.buildImageFileName(String).
 */
export function buildImageFileName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const uuid = crypto.randomUUID().replace(/-/g, "");
  return `${uuid}${ext}`;
}

/**
 * Extracts the last path segment of a URL as a filename.
 * Mirrors Java's LoomUtility.extractFileNameFromUrl(String).
 */
export function extractFileNameFromUrl(fileUrl: string): string {
  try {
    const url = new URL(fileUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "";
  } catch {
    return fileUrl.split("/").pop() ?? "";
  }
}

/**
 * Normalises a raw string into a URL-safe slug.
 * Mirrors Java's LoomUtility.buildCompatibleSlug(String).
 */
export function buildCompatibleSlug(raw: string): string {
  return decodeURIComponent(raw)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Returns true if the string is null, undefined, or blank.
 * Mirrors Java's Pastebox.isEmptyString() usage in LoomUtility.
 */
export function isEmptyString(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.trim().length === 0;
}

/**
 * Application-wide constants.
 * Mirrors Java's Constant class (SCOPE_SINGLETON removed — not applicable in NestJS).
 */
export const RESPONSE_TYPE_APPLICATION_JSON = "application/json";
export const REQUEST_TYPE_APPLICATION_JSON = "application/json";
export const REQUEST_TYPE_MULTIPART_FORM_DATA = "multipart/form-data";
// @ts-nocheck
// @ts-nocheck
