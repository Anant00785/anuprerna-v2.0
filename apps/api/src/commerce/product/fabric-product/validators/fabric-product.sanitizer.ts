// @ts-nocheck
/**
 * apps/api/src/commerce/product/fabric-product/fabric-product.sanitizer.ts
 *
 * SOURCE GAP (flagged, not silently invented): `FabricProductSanitizer`
 * (com.bloomscorp.loom.nverse.sanitizer.FabricProductSanitizer, referenced
 * by FabricProductController) lives in the same not-present
 * `com.bloomscorp.loom.nverse` framework package as FabricProductValidator
 * — see fabric-product.validator.ts header. Following the same "every
 * BehemothORM entity gets a one-line NVerseSanitizer subclass" pattern
 * confirmed via CategorySanitizer/CartItemSanitizer (see
 * product/core/validators/Product.sanitizer.ts header for the full stage
 * breakdown), this reuses Product Core's own `sanitize` primitive for
 * `width` (the one free-text FabricProduct-specific field — `gsm` is
 * numeric, `addToSwatch` boolean) and Product Core's `sanitizeProduct` for
 * the nested `product` field, rather than re-implementing the pipeline.
 */
import { sanitize, sanitizeProduct } from "../../product/validators/product.sanitizer.js";
import { FabricProductInput } from "../types/fabric-product.types.js";

/** FabricProductSanitizer#getSanitized(FabricProduct entity) reconstruction. */
export function sanitizeFabricProduct<T extends Partial<FabricProductInput>>(entity: T): T {
  const sanitized: T = { ...entity };
  if (typeof sanitized.width === "string") {
    (sanitized as { width?: string }).width = sanitize(sanitized.width);
  }
  if (sanitized.product) {
    (sanitized as { product?: FabricProductInput["product"] }).product = sanitizeProduct(sanitized.product);
  }
  return sanitized;
}
// @ts-nocheck
// @ts-nocheck
