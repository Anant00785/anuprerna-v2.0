/**
 * apps/api/src/product/finished-product/sanitizer/finished-product.sanitizer.ts
 *
 * Intended port of com.bloomscorp.loom.nverse.sanitizer.FinishedProductSanitizer,
 * referenced by FinishedProductController but whose class body — like
 * FinishedProductValidator — lives outside this repository (package
 * com.bloomscorp.loom.nverse.sanitizer, not present in any uploaded archive).
 *
 * Following the same convention established for CartItemSanitizer
 * (apps/api/src/commerce/cart/validators/cart-item.sanitizer.ts), such
 * sanitizers in this codebase extend an external `NVerseSanitizer<I, O>`
 * base whose `getSanitized(entity)` calls `sanitizeObject(entity)` —
 * reflection-based sanitization of every `java.lang.String` field on the
 * entity.
 *
 * Source-verified: com.bloomscorp.loom.product.orm.FinishedProduct has
 * exactly one field, `product` (an object relation, not a String). A
 * reflection-based "sanitize every String field" pass over FinishedProduct
 * itself therefore has nothing to touch — this is a faithful, not a lazy,
 * no-op at this level. Sanitizing the *nested* product's own String fields
 * (name, sku, slug, etc.) is the Product module's sanitizer's job, out of
 * scope here for the same reason noted in the validator file.
 */
import { FinishedProductInput } from "../types/finished-product.types.js";

/** FinishedProductSanitizer#getSanitized(entity) */
export function sanitizeFinishedProduct<T extends Partial<FinishedProductInput>>(entity: T): T {
  // No own String field exists on FinishedProduct to sanitize (see header).
  return { ...entity };
}
