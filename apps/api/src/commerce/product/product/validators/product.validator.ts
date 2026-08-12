/**
 * apps/api/src/product/core/validators/Product.validator.ts
 *
 * SOURCE GAP (flagged, not silently invented): unlike Category
 * (com.bloomscorp.loom.product.category.validator.CategoryValidator), no
 * ProductValidator class exists anywhere in the uploaded Java repository
 * for com.bloomscorp.loom.product.orm.Product. CategoryValidator's own
 * pattern — `implements NVerseValidator<T>`, delegating to external
 * `StringValidator` / `ImageValidator` from com.bloomscorp.nverse.validator
 * (not present in this repository) — is the only Product-domain precedent
 * available to port from, and it doesn't cover Product's field set.
 *
 * ProductDAOController#createProduct / #updateProduct (the closest thing
 * to "Product's validation logic" that IS in the source) never calls a
 * validator at all — it relies entirely on the `product` table's own
 * NOT NULL / UNIQUE constraints to reject bad data at the database layer
 * (see Product.repository.ts's OptimisticLockError / unique-violation
 * handling for how that surfaces).
 *
 * This file is therefore a reconstruction, not a port: a structural
 * pre-flight check against exactly the NOT NULL columns on the
 * introspected `product` pgTable (schema.ts), so a malformed request fails
 * fast with a clear reason instead of a raw Postgres constraint error.
 * It does NOT invent business rules (minimum price, quantity floors, etc.)
 * that no source file establishes — confirm against a live ProductValidator
 * class (if one exists outside this repository snapshot) before treating
 * this as authoritative.
 */
import { ProductInput, UNITS } from "../types/product.types.js";

const VALID_UNITS = new Set<string>(UNITS);

export interface ProductValidationResult {
  valid: boolean;
  reasons: string[];
}

/**
 * Structural validation mirroring the `product` table's NOT NULL columns:
 * sub_category_id, name, sku, sku_group_id, price, main_product_check,
 * product_overview, product_care, material_id, color_id, product_group,
 * product_video, unit — all NOT NULL in schema.ts. `slug` is also NOT
 * NULL but is server-generated (LoomUtility.generateSlug(name) in
 * ProductDAOController#createProduct/#updateProduct), so it's not part of
 * the input contract and isn't checked here.
 */
export function validateProductInput(entity: ProductInput): ProductValidationResult {
  const reasons: string[] = [];

  if (!Number.isInteger(entity.subCategoryId) || entity.subCategoryId <= 0) {
    reasons.push("subCategoryId is required.");
  }
  if (!entity.name || entity.name.trim().length === 0) {
    reasons.push("name is required.");
  }
  if (!entity.sku || entity.sku.trim().length === 0) {
    reasons.push("sku is required.");
  }
  if (!Number.isInteger(entity.skuGroupId) || entity.skuGroupId <= 0) {
    reasons.push("skuGroupId is required.");
  }
  if (typeof entity.price !== "number" || Number.isNaN(entity.price)) {
    reasons.push("price is required.");
  }
  if (typeof entity.mainProductCheck !== "boolean") {
    reasons.push("mainProductCheck is required.");
  }
  if (typeof entity.productOverview !== "string") {
    reasons.push("productOverview is required.");
  }
  if (typeof entity.productCare !== "string") {
    reasons.push("productCare is required.");
  }
  if (typeof entity.materialId !== "string") {
    reasons.push("materialId is required.");
  }
  if (typeof entity.colorId !== "string") {
    reasons.push("colorId is required.");
  }
  if (!entity.productGroup) {
    reasons.push("productGroup is required.");
  }
  if (typeof entity.productVideo !== "string") {
    reasons.push("productVideo is required.");
  }
  if (!VALID_UNITS.has(entity.unit)) {
    reasons.push(`unit must be one of ${UNITS.join(", ")}.`);
  }

  // main_product_id has no explicit NOT NULL guard, but per
  // ProductDAOController#createProduct/#updateProduct: `if
  // (entity.isMainProductCheck()) entity.setMainProductId(null);` — a
  // product flagged as a main product never carries a mainProductId. Not
  // a rejection in source (it's silently corrected, not validated), so
  // this validator does not reject the combination either — see
  // Product.mapper.ts for where that correction is ported.

  return { valid: reasons.length === 0, reasons };
}
// @ts-nocheck
// @ts-nocheck
