// @ts-nocheck
/**
 * apps/api/src/commerce/product-size-profile/validator/product-size-profile.validator.ts
 *
 * NOT a port of a dedicated business-rule validator class — no
 * `ProductSizeProfileValidator.java` (or equivalent) exists anywhere in the
 * uploaded `product.zip` source, unlike Cart's `CartItemValidator`. The
 * rules below are instead derived directly from the entity's own
 * source-verified column constraints
 * (com.bloomscorp.loom.product.product.orm.ProductSizeProfile /
 * ProductSizeProfileContract):
 *
 *  1. productId          -> @ManyToOne(optional = false)  -> required, > 0
 *  2. sizeProfileOptionId -> @ManyToOne(optional = false)  -> required, > 0
 *  3. sizeProfileOptionSku -> @Column(nullable = false)    -> required, non-empty
 *  4. quantity            -> @Column(nullable = false), primitive int -> required, integer, >= 0
 *     (primitive `int` in the Java field means it can never be null/negative
 *     is not enforced by the type itself, but a negative on-hand quantity
 *     has no domain meaning here, so >= 0 is enforced defensively)
 *  5. disabled             -> @Column(nullable = false) @ColumnDefault("false") -> boolean, defaults false
 *  6. consumedFabric        -> @Column(columnDefinition = "NUMERIC"), boxed Double, no `nullable = false`
 *     -> genuinely optional; only type-checked when present
 *
 * Nothing else is rejected here, matching the "only enforce what source
 * actually enforces" discipline used in cart-item.validator.ts.
 */
import { ProductSizeProfileInput } from "../types/product-size-profile.types.js";

export function validateProductSizeProfile(entity: ProductSizeProfileInput): boolean {
  if (!Number.isInteger(entity.productId) || entity.productId <= 0) {
    return false;
  }

  if (!Number.isInteger(entity.sizeProfileOptionId) || entity.sizeProfileOptionId <= 0) {
    return false;
  }

  if (typeof entity.sizeProfileOptionSku !== "string" || entity.sizeProfileOptionSku.trim().length === 0) {
    return false;
  }

  if (!Number.isInteger(entity.quantity) || entity.quantity < 0) {
    return false;
  }

  if (
    entity.consumedFabric !== undefined &&
    entity.consumedFabric !== null &&
    (typeof entity.consumedFabric !== "number" || Number.isNaN(entity.consumedFabric))
  ) {
    return false;
  }

  return true;
}
// @ts-nocheck
// @ts-nocheck
