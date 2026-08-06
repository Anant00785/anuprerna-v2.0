/**
 * apps/api/src/commerce/product-zoho-relation/validator/product-zoho-relation.validator.ts
 *
 * NOT a port of a dedicated business-rule validator class — no
 * `ProductZohoRelationValidator.java` (or equivalent) exists anywhere in
 * the uploaded `product.zip` source, same situation as ProductSizeProfile.
 * The rules below are derived directly from the entity's own
 * source-verified column constraints
 * (com.bloomscorp.loom.product.product.orm.ProductZohoRelation /
 * ProductZohoRelationContract):
 *
 *  1. productId      -> @ManyToOne(nullable = false)                    -> required, > 0
 *  2. sku             -> @Column(nullable = false, unique = true)         -> required, non-empty
 *  3. zohoItemId       -> @Column(nullable = false, unique = true) @ColumnDefault("''") -> string when present, may be empty (matches the "" default)
 *  4. hsnCode           -> @Column(nullable = false) @ColumnDefault("''") -> string when present, may be empty
 *  5. purchasePrice      -> @Column(nullable = false) @ColumnDefault("0.001"), primitive double -> number when present, must be finite
 *  6. tax                 -> @Column(nullable = false), primitive double, no default -> required, finite number
 *  7. disabled              -> @Column(nullable = false) @ColumnDefault("false") -> boolean, defaults false
 *
 * Nothing else is rejected here, matching the "only enforce what source
 * actually enforces" discipline used in cart-item.validator.ts /
 * product-size-profile.validator.ts. In particular: source has no
 * uniqueness check at the validator level (both unique constraints are
 * DB-enforced only), so none is duplicated here.
 */
import { ProductZohoRelationInput } from "../types/product-zoho-relation.types.js";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function validateProductZohoRelation(entity: ProductZohoRelationInput): boolean {
  if (!Number.isInteger(entity.productId) || entity.productId <= 0) {
    return false;
  }

  if (typeof entity.sku !== "string" || entity.sku.trim().length === 0) {
    return false;
  }

  if (entity.zohoItemId !== undefined && typeof entity.zohoItemId !== "string") {
    return false;
  }

  if (entity.hsnCode !== undefined && typeof entity.hsnCode !== "string") {
    return false;
  }

  if (entity.purchasePrice !== undefined && !isFiniteNumber(entity.purchasePrice)) {
    return false;
  }

  if (!isFiniteNumber(entity.tax)) {
    return false;
  }

  return true;
}