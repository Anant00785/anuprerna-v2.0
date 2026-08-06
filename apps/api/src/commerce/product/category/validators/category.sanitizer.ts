/**
 * apps/api/src/commerce/product/category/validators/category.sanitizer.ts
 *
 * Direct port of com.bloomscorp.loom.product.category.sanitizer.CategorySanitizer,
 * which itself only calls through to the external NVerseSanitizer base class
 * (same pipeline documented in documentation/bmx-nverse.md and already
 * ported once for Cart — see cart/validators/cart-item.sanitizer.ts for the
 * full stage-by-stage writeup). Reproduced here for Category's string
 * fields rather than imported cross-domain, matching source's one-
 * sanitizer-per-entity structure.
 *
 * sanitizeObject(entity) sanitizes every java.lang.String field via
 * reflection with no fieldTypes argument. For Category that's: name,
 * metaTitle, metaDescription. `icon` / `socialImage` are server-assigned
 * S3 URLs (never raw user text at the point this sanitizer would run), so
 * they're intentionally excluded, mirroring how Cart excluded its
 * enum-typed and untyped-JSONB fields.
 */
import { CategoryInput } from "../types/category.types.js";

const NULL_BYTE = /\0/g;

// Stage 2 — XSS stripping, verbatim pattern list from bmx-nverse.md.
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

/**
 * Stage 3 substitute — conservative HTML allowlist, identical to Cart's.
 * NOT verified against the OWASP Java HTML Sanitizer's exact policy;
 * strips any tag not in the documented allow-category list.
 */
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

const STRING_FIELDS: (keyof CategoryInput)[] = ["name", "metaTitle", "metaDescription"];

/** CategorySanitizer#getSanitized(Category entity) */
export function sanitizeCategory<T extends Partial<CategoryInput>>(entity: T): T {
  const sanitized: T = { ...entity };
  for (const field of STRING_FIELDS) {
    const value = (sanitized as Record<string, unknown>)[field];
    if (typeof value === "string") {
      (sanitized as Record<string, unknown>)[field] = sanitize(value);
    }
  }
  return sanitized;
}
