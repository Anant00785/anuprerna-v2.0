/**
 * apps/api/src/product/special-status/special-status.sanitizer.ts
 *
 * Direct port of `com.bloomscorp.loom.nverse.sanitizer.SpecialStatusSanitizer`
 * (referenced in SpecialStatusController as `new SpecialStatusSanitizer()`),
 * which, like the in-repo product.category.sanitizer.CategorySanitizer,
 * only ever calls through to the external NVerseSanitizer base class:
 *
 *   public class SpecialStatusSanitizer extends NVerseSanitizer<SpecialStatus, SpecialStatus> {
 *       @Override
 *       public SpecialStatus getSanitized(SpecialStatus entity) {
 *           return this.sanitizeObject(entity);
 *       }
 *   }
 *
 * The three-stage pipeline run by NVerseSanitizer#sanitize(String) is
 * reproduced stage-for-stage exactly as ported in
 * product/sku_group/SkuGroup.sanitizer.ts and
 * commerce/cart/validators/cart-item.sanitizer.ts:
 *
 *   1. Canonicalization    — strip null bytes (\0).
 *   2. XSS stripping       — remove <script>, <iframe>, inline src=, eval(),
 *                             expression(), javascript:, vbscript:, onload=
 *                             patterns via regex.
 *   3. OWASP HTML sanitization — allow only safe formatting/block/image/
 *                             link/style/table elements.
 *
 * sanitizeObject(O object, Class<?>... fieldTypes) sanitizes, via
 * reflection, every field of the given type(s); SpecialStatusSanitizer
 * calls it with no fieldTypes argument, same as
 * CategorySanitizer/SkuGroupSanitizer/CartItemSanitizer — ASSUMED to
 * default to "every String field" (only `name` on SpecialStatus).
 *
 * Stage 3 (OWASP Java HTML Sanitizer) has no drop-in Node equivalent
 * reproduced from source. Below is the same conservative allowlist
 * approximation used in SkuGroup.sanitizer.ts / cart-item.sanitizer.ts —
 * SWAP THIS for a vetted library (e.g. `sanitize-html`, once added as a
 * real dependency) configured to the same allowlist before shipping to
 * production.
 */
import { CreateSpecialStatusInput, UpdateSpecialStatusInput } from "../types/special-status.types.js";

const NULL_BYTE = /\0/g;

// Stage 2 — XSS stripping, verbatim pattern list ported from
// product/sku_group/SkuGroup.sanitizer.ts / commerce/cart/validators/cart-item.sanitizer.ts.
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

/**
 * SpecialStatusSanitizer#getSanitized(SpecialStatus entity) — sanitizes
 * every String field on the incoming payload in place. `name` is the only
 * String field on SpecialStatus (id/version/timeOfCreation are numeric),
 * matching the reflection-based sanitizer only ever targeting
 * java.lang.String fields.
 */
export function sanitizeSpecialStatus<T extends CreateSpecialStatusInput | UpdateSpecialStatusInput>(
  entity: T,
): T {
  return {
    ...entity,
    name: sanitize(entity.name),
  };
}
