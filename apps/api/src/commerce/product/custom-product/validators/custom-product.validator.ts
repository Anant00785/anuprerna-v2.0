// @ts-nocheck
/**
 * apps/api/src/product/custom-product/validator/custom-product.validator.ts
 *
 * Intended port of com.bloomscorp.loom.nverse.validator.CustomProductValidator,
 * referenced by CustomProductController but whose class body lives outside
 * this repository (package com.bloomscorp.loom.nverse.validator — not
 * present in any uploaded archive, same gap flagged for FinishedProduct/
 * CartItemValidator's NVerseSanitizer base).
 *
 * What IS source-verified: every `nullable = false` column on
 * com.bloomscorp.loom.product.orm.CustomProduct — name, sku, price,
 * productGroup, unit. remarks/heroImage/additionalImages/additionalDocs are
 * also `nullable = false` but have field-initializer + `@ColumnDefault("")`
 * defaults, so they're not required from a *caller's* perspective (the
 * mapper/repository fill "" when absent) — matching how the DTO layer
 * already treats them as optional. The rules below are the ones directly
 * derivable from those constraints; confirm against the live
 * CustomProductValidator class before shipping if deeper rules (e.g. sku
 * uniqueness, price > 0) are expected — not verifiable from the entity
 * mapping alone.
 */
import { CustomProductInput, UNITS } from "../types/custom-product.types.js";

const VALID_UNITS = new Set<string>(UNITS);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidUnit(unit: unknown): boolean {
  return unit === undefined || (typeof unit === "string" && VALID_UNITS.has(unit));
}

function isValidPrice(price: unknown): boolean {
  return typeof price === "number" && Number.isFinite(price);
}

/** validate(CustomProduct entity) — shared by create and update paths. */
export function validateCustomProduct(entity: CustomProductInput): boolean {
  return (
    isNonEmptyString(entity.name) &&
    isNonEmptyString(entity.sku) &&
    isValidPrice(entity.price) &&
    isNonEmptyString(entity.productGroup) &&
    isValidUnit(entity.unit)
  );
}

/** validate(CustomProduct entity) — update path additionally requires id. */
export function validateUpdateCustomProduct(entity: CustomProductInput): boolean {
  return typeof entity.id === "number" && Number.isInteger(entity.id) && validateCustomProduct(entity);
}
// @ts-nocheck
// @ts-nocheck
