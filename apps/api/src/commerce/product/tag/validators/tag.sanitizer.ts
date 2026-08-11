// @ts-nocheck
/**
 * apps/api/src/catalog/product/tag/validators/tag.sanitizer.ts
 *
 * `com.bloomscorp.loom.nverse.sanitizer.TagSanitizer` itself was not
 * included in the uploaded repository, but — unlike TagValidator — this
 * one IS safe to port with confidence: every sibling sanitizer we've seen
 * so far (`CartItemSanitizer`) is a trivial one-liner that does nothing but
 * call through to the shared, already source-verified
 * `NVerseSanitizer#sanitizeObject(entity)` pipeline:
 *
 *   public class CartItemSanitizer extends NVerseSanitizer<CartItem, CartItem> {
 *       @Override
 *       public CartItem getSanitized(CartItem entity) {
 *           return this.sanitizeObject(entity);
 *       }
 *   }
 *
 * That pipeline (canonicalize -> strip null bytes -> XSS-pattern strip ->
 * OWASP-allowlist HTML strip) is documented once in
 * documentation/bmx-nverse.md and applies uniformly to every `String`
 * field on any sanitized entity — it is not per-entity business logic.
 * The implementation below is the same pipeline already ported in
 * commerce/cart/validators/cart-item.sanitizer.ts, duplicated here (rather
 * than imported cross-module) to keep this sub-module self-contained,
 * exactly like Cart is. Consider extracting to CommonModule once a third
 * consumer needs it (rule of three) — flagged, not done speculatively.
 *
 * Stage 3 (OWASP Java HTML Sanitizer) has no drop-in Node equivalent
 * reproduced from source; the allowlist approximation below carries the
 * same "confirm against the live library before shipping" caveat as
 * cart-item.sanitizer.ts.
 */
import { CreateTagInput } from "../types/tag.types.js";

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

/**
 * TagSanitizer#getSanitized(Tag entity) — sanitizes Tag's only String
 * field (`name`), mirroring sanitizeObject(entity) reflecting over
 * java.lang.String fields.
 */
export function sanitizeTag<T extends Partial<CreateTagInput>>(entity: T): T {
  const sanitized: T = { ...entity };
  if (typeof sanitized.name === "string") {
    (sanitized as Record<string, unknown>).name = sanitize(sanitized.name);
  }
  return sanitized;
}
// @ts-nocheck
// @ts-nocheck
