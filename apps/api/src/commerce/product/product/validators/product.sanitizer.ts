/**
 * apps/api/src/product/core/validators/Product.sanitizer.ts
 *
 * SOURCE GAP (flagged, not silently invented): no ProductSanitizer class
 * exists anywhere in the uploaded Java repository for
 * com.bloomscorp.loom.product.orm.Product — only
 * com.bloomscorp.loom.product.category.sanitizer.CategorySanitizer and
 * (outside this repository) com.bloomscorp.loom.cart.sanitizer.CartItemSanitizer
 * were found, both trivial one-method subclasses of the external
 * `com.bloomscorp.nverse.sanitizer.NVerseSanitizer<T, T>` base class:
 *
 *   public class CategorySanitizer extends NVerseSanitizer<Category, Category> {
 *       @Override
 *       public Category getSanitized(Category entity) {
 *           return this.sanitizeObject(entity);
 *       }
 *   }
 *
 * Every BehemothORM entity in this codebase that accepts free-text input
 * appears to follow this same one-line pattern, so this file reconstructs
 * the equivalent for Product by reusing the identical three-stage pipeline
 * already ported (and documented in full, including the NVerseSanitizer
 * stage breakdown from documentation/bmx-nverse.md) in
 * commerce/cart/validators/cart-item.sanitizer.ts — duplicated here rather
 * than imported cross-module, matching how each Cart/Category sanitizer is
 * its own small class in source rather than a shared utility.
 *
 * Stage 3 (OWASP Java HTML Sanitizer) again has no drop-in Node
 * equivalent reproduced from source — same conservative allowlist
 * approximation as cart-item.sanitizer.ts. SWAP THIS for a vetted library
 * (e.g. `sanitize-html`) before shipping to production.
 */
import { ProductInput } from "../types/product.types.js";

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

const STRING_FIELDS: (keyof ProductInput)[] = [
  "name",
  "sku",
  "productOverview",
  "productCare",
  "materialId",
  "colorId",
  "patternId",
  "tagId",
  "heroImage",
  "hoverImage",
  "galleryImages",
  "productGroup",
  "productVideo",
  "metaTitle",
  "metaDescription",
  "heroImageAlt",
  "hoverImageAlt",
  "productVideoAlt",
  "backwardCompatibleLink",
  "finishProfileItemId",
];

/**
 * ProductSanitizer#getSanitized(Product entity) reconstruction —
 * sanitizes every String field on the incoming payload, mirroring
 * sanitizeObject(entity)'s reflection-based "every java.lang.String field"
 * behavior. Non-string / nested fields (unit, productSizeProfileList,
 * imageGallerySEOList, productSpecificSizeProfile) are left untouched,
 * matching CartItemSanitizer's own scope (enums and JSONB not touched).
 */
export function sanitizeProduct<T extends Partial<ProductInput>>(entity: T): T {
  const sanitized: T = { ...entity };
  for (const field of STRING_FIELDS) {
    const value = (sanitized as Record<string, unknown>)[field];
    if (typeof value === "string") {
      (sanitized as Record<string, unknown>)[field] = sanitize(value);
    }
  }
  return sanitized;
}
