/**
 * apps/api/src/commerce/product/fabric-product/fabric-product.validator.ts
 *
 * SOURCE GAP (flagged, not silently invented): `FabricProductValidator`
 * (com.bloomscorp.loom.nverse.validator.FabricProductValidator, referenced
 * by FabricProductController) lives in the `com.bloomscorp.loom.nverse`
 * framework package, not present anywhere in the uploaded repository —
 * same class of gap as Product Core's own ProductValidator (see
 * product/core/validators/Product.validator.ts header for the full
 * reasoning). This file is a reconstruction: a structural pre-flight
 * check against the `product_fabric` table's own NOT NULL columns
 * (product_id, gsm, width — all NOT NULL in schema.ts; add_to_swatch is
 * NOT NULL but has a DB default, so it's not part of the input contract),
 * PLUS Product Core's own validator reused verbatim for the nested
 * `product` field — not a re-implementation of Product Core's rules.
 */
import { validateProductInput } from "../../product/validators/product.validator.js";
import { FabricProductInput } from "../types/fabric-product.types.js";

export interface FabricProductValidationResult {
  valid: boolean;
  reasons: string[];
}

export function validateFabricProductInput(entity: FabricProductInput): FabricProductValidationResult {
  const reasons: string[] = [];

  if (!Number.isInteger(entity.gsm) || entity.gsm <= 0) {
    reasons.push("gsm is required.");
  }
  if (!entity.width || entity.width.trim().length === 0) {
    reasons.push("width is required.");
  }

  const productResult = validateProductInput(entity.product);
  if (!productResult.valid) {
    reasons.push(...productResult.reasons.map((r) => `product.${r}`));
  }

  return { valid: reasons.length === 0, reasons };
}
