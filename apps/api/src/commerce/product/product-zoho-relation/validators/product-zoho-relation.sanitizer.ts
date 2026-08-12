/**
 * apps/api/src/commerce/product-zoho-relation/sanitizer/product-zoho-relation.sanitizer.ts
 *
 * NOT a port of a dedicated sanitizer class — no
 * `ProductZohoRelationSanitizer.java` exists in the uploaded source, same
 * situation as ProductSizeProfile. Reusing the *pipeline*, not a source
 * class: `sku`, `zohoItemId`, and `hsnCode` are this entity's `String`-typed
 * fields (com.bloomscorp.loom.product.product.orm.ProductZohoRelation), and
 * every sanitizer class documented in this codebase is a thin wrapper
 * around the shared `NVerseSanitizer#sanitizeObject(entity)` base (see
 * cart-item.sanitizer.ts's header for the documented three-stage pipeline),
 * which reflectively sanitizes every String field regardless of entity.
 * Applying that same documented pipeline to this entity's String fields is
 * a reasonable, disclosed inference from project convention — not a
 * source-verified `ProductZohoRelationSanitizer.java` port. Confirm against
 * the live NVerseSanitizer library before shipping.
 *
 *   1. Canonicalization    — strip null bytes (\0).
 *   2. XSS stripping       — remove <script>, <iframe>, inline src=, eval(),
 *                             expression(), javascript:, vbscript:, onload=
 *                             patterns via regex.
 *   3. OWASP HTML sanitization — allow only safe formatting/block/image/
 *                             link/style/table elements.
 *
 * Stage 3 (OWASP Java HTML Sanitizer) has no drop-in Node equivalent
 * reproduced from source. Below is the same conservative allowlist
 * approximation used in cart-item.sanitizer.ts / product-size-profile.sanitizer.ts
 * — SWAP THIS for a vetted library (e.g. `sanitize-html`, once added as a
 * real dependency) configured to the same allowlist before shipping to
 * production.
 */
import { ProductZohoRelationInput } from "../types/product-zoho-relation.types.js";

const NULL_BYTE = /\0/g;

// Stage 2 — XSS stripping, verbatim pattern list from bmx-nverse.md (see cart-item.sanitizer.ts).
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
 * Stage 3 substitute — conservative HTML allowlist. NOT verified against
 * the OWASP Java HTML Sanitizer's exact policy (external, not in this
 * repository); strips any tag not in the documented allow-category list.
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

const STRING_FIELDS: (keyof ProductZohoRelationInput)[] = ["sku", "zohoItemId", "hsnCode"];

/**
 * sanitizeObject(entity) analogue — sanitizes the entity's String fields
 * (`sku`, `zohoItemId`, `hsnCode`) in place. `productId`/`purchasePrice`/
 * `tax` are numeric and `disabled` is boolean, so none of those are
 * touched, matching the reflection-based sanitizer only ever targeting
 * java.lang.String fields.
 */
export function sanitizeProductZohoRelation<T extends Partial<ProductZohoRelationInput>>(entity: T): T {
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
