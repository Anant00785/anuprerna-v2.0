/**
 * apps/api/src/product/finished-product/validator/finished-product.validator.ts
 *
 * Intended port of com.bloomscorp.loom.nverse.validator.FinishedProductValidator,
 * referenced by FinishedProductController but whose class body lives outside
 * this repository (package com.bloomscorp.loom.nverse.validator — not present
 * in any uploaded archive, same situation as CartItemValidator's NVerseSanitizer
 * base class). NOT invented here.
 *
 * What IS source-verified: the FinishedProduct entity itself
 * (com.bloomscorp.loom.product.orm.FinishedProduct) has exactly one field —
 * `product` (a `@OneToOne`, `nullable = false` relation). There is no other
 * own field on FinishedProduct for a validator to check. So the rule below
 * is the one rule directly derivable from the entity mapping:
 *   - product must be present (NOT NULL relation) — for create
 *   - id must be present in addition, for update
 *
 * Any additional validation FinishedProductValidator performs against the
 * *nested* product fields belongs to the Product module's own validator
 * (out of scope here — Product is a completed domain but its validator
 * source wasn't shared into this conversation either). Confirm against the
 * live com.bloomscorp.loom.nverse.validator.FinishedProductValidator class
 * before shipping if deeper rules are expected.
 */
import { FinishedProductInput } from "../types/finished-product.types.js";

function hasProduct(entity: FinishedProductInput): boolean {
  return entity.product !== null && entity.product !== undefined && typeof entity.product === "object";
}

/** validate(FinishedProduct entity) — create path (id absent/ignored). */
export function validateFinishedProduct(entity: FinishedProductInput): boolean {
  return hasProduct(entity);
}

/** validate(FinishedProduct entity) — update path additionally requires id. */
export function validateUpdateFinishedProduct(entity: FinishedProductInput): boolean {
  return typeof entity.id === "number" && Number.isInteger(entity.id) && hasProduct(entity);
}
