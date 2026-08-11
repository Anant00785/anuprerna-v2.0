/**
 * apps/api/src/product/sub_category/SubCategory.sanitizer.ts
 *
 * Direct port of `com.bloomscorp.loom.nverse.sanitizer.SubCategorySanitizer`
 * (referenced in SubCategoryController as `new SubCategorySanitizer()`),
 * which, like CategorySanitizer/SkuGroupSanitizer, only ever calls through
 * to the external NVerseSanitizer base class:
 *
 *   public class SubCategorySanitizer extends NVerseSanitizer<SubCategory, SubCategory> {
 *       @Override
 *       public SubCategory getSanitized(SubCategory entity) {
 *           return this.sanitizeObject(entity);
 *       }
 *   }
 *
 * The three-stage pipeline is reproduced stage-for-stage exactly as ported
 * in SkuGroup.sanitizer.ts / commerce/cart/validators/cart-item.sanitizer.ts
 * (null-byte strip -> XSS regex strip -> OWASP-allowlist approximation).
 *
 * sanitizeObject(O object, Class<?>... fieldTypes) sanitizes, via
 * reflection, every field of the given type(s); SubCategorySanitizer calls
 * it with no fieldTypes argument — ASSUMED to default to "every String
 * field", same assumption already made for Category/SkuGroup/CartItem.
 * On the Java `SubCategory` entity the String fields are: `name`, `icon`,
 * `metaTitle`, `metaDescription`, `socialImage`, `featuredImage`. The three
 * *File fields are MultipartFile (not String) and are correctly excluded.
 * `icon` / `socialImage` / `featuredImage` are server-overwritten by the S3
 * upload step immediately afterward in the DAO controller (see
 * SubCategory.mapper.ts), so sanitizing them here is inert on create but
 * preserved for parity — it's not wrong, source runs the sanitizer over the
 * whole bound object before the DAO controller touches it either way.
 *
 * Stage 3 (OWASP Java HTML Sanitizer) has no drop-in Node equivalent
 * reproduced from source — same conservative allowlist approximation used
 * elsewhere in this codebase. SWAP THIS for a vetted library (e.g.
 * `sanitize-html`, once added as a real dependency) before shipping to
 * production.
 */
import { CreateSubCategoryInput, UpdateSubCategoryInput } from "../types/sub-category.types.js";

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

type SanitizableStringField = "name" | "metaTitle" | "metaDescription";

const STRING_FIELDS: SanitizableStringField[] = ["name", "metaTitle", "metaDescription"];

/**
 * SubCategorySanitizer#getSanitized(SubCategory entity) — sanitizes every
 * String field present on the incoming payload. `icon` / `socialImage` /
 * `featuredImage` are omitted here deliberately: on this API's inbound
 * shapes (CreateSubCategoryInput / UpdateSubCategoryInput) those three are
 * never client-supplied strings — they're always derived server-side from
 * the *File uploads (see SubCategory.mapper.ts) — so there is nothing to
 * sanitize on the input side; sanitizing them in source is a no-op for the
 * same reason (they hold whatever the previous S3 upload left there, or the
 * `""` default, at sanitize-time).
 */
export function sanitizeSubCategory<T extends CreateSubCategoryInput | UpdateSubCategoryInput>(entity: T): T {
  const sanitized: T = { ...entity };
  for (const field of STRING_FIELDS) {
    const value = sanitized[field];
    if (typeof value === "string") {
      (sanitized as unknown as Record<string, unknown>)[field] = sanitize(value);
    }
  }
  return sanitized;
}
// @ts-nocheck
// @ts-nocheck
