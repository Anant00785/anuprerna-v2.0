/**
 * apps/api/src/commerce/product/segment/validators/segment.sanitizer.ts
 *
 * SegmentController wires `com.bloomscorp.loom.nverse.sanitizer.SegmentSanitizer`
 * — an external nverse-package class, not a local `product.segment.sanitizer`
 * type (contrast with Category, whose `CategorySanitizer` was local source
 * calling through to the documented `NVerseSanitizer` base). The base
 * three-stage pipeline (null-byte strip -> XSS pattern strip -> HTML
 * allowlist) is documented in documentation/bmx-nverse.md and is the same
 * pipeline every other sanitizer in this codebase (Cart, Category) has been
 * ported from — reused verbatim here on the assumption `SegmentSanitizer`
 * follows the same `NVerseSanitizer<Segment, Segment>` pattern its sibling
 * domains do. Flagged for confirmation against the live class before
 * shipping, same caveat as Category's sanitizer.
 */
import { SegmentInput } from "../types/segment.types.js";

const NULL_BYTE = /\0/g;

const XSS_PATTERNS: RegExp[] = [
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
  /\bsrc\s*=\s*["'][^"']*["']/gi,
  /\beval\s*\([^)]*\)/gi,
  /\bexpression\s*\([^)]*\)/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /\bonload\s*=\s*["'][^"']*["']/gi,
];

const ALLOWED_TAGS = new Set([
  "b", "i", "em", "strong", "u", "s", "sub", "sup", "br",
  "p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote",
  "img", "a",
  "span", "table", "thead", "tbody", "tr", "td", "th",
]);

function stripDisallowedTags(value: string): string {
  return value.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, tagName: string) => {
    return ALLOWED_TAGS.has(tagName.toLowerCase()) ? match : "";
  });
}

/** NVerseSanitizer#sanitize(String) */
export function sanitize(value: string): string {
  let result = value.replace(NULL_BYTE, "");
  for (const pattern of XSS_PATTERNS) {
    result = result.replace(pattern, "");
  }
  result = stripDisallowedTags(result);
  return result;
}

const STRING_FIELDS: (keyof SegmentInput)[] = ["name", "metaTitle", "metaDescription"];

/** SegmentSanitizer#getSanitized(Segment entity) */
export function sanitizeSegment<T extends Partial<SegmentInput>>(entity: T): T {
  const sanitized: T = { ...entity };
  for (const field of STRING_FIELDS) {
    const value = (sanitized as Record<string, unknown>)[field];
    if (typeof value === "string") {
      (sanitized as Record<string, unknown>)[field] = sanitize(value);
    }
  }
  return sanitized;
}
// @ts-nocheck
// @ts-nocheck
