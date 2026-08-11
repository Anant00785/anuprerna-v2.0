/**
 * apps/api/src/product/special-status/special-status.validator.ts
 *
 * Port of com.bloomscorp.loom.nverse.validator.SpecialStatusValidator.
 *
 * IMPORTANT — source availability note: SpecialStatusController references
 * `com.bloomscorp.loom.nverse.validator.SpecialStatusValidator`, which
 * lives in the external `nverse` package and is NOT present in the
 * uploaded repository (unlike e.g. CategoryValidator, which lives in-module
 * at product.category.validator and IS present). This port is therefore
 * modeled on the one comparable in-repo validator that also guards a
 * single unique `name` column with the same StringValidator dependency —
 * product.category.validator.CategoryValidator:
 *
 *   return stringValidator.validate(entity.getName(), 1, 255);
 *
 * (CategoryValidator additionally validates two image fields that
 * SpecialStatus doesn't have — icon/social image — so those are correctly
 * omitted here, not dropped.) This is the identical inference already
 * applied to product/sku_group/SkuGroup.validator.ts, which has the same
 * "external nverse validator, not present in repo, one unique name column"
 * shape. The exact bounds SpecialStatusValidator itself uses are NOT
 * confirmed against source; 1..255 mirrors both CategoryValidator's usage
 * and the `varchar(255)` column width on `special_status.name` (schema.ts).
 * Confirm against the live nverse.validator.SpecialStatusValidator before
 * shipping to production.
 */
import { CreateSpecialStatusInput, UpdateSpecialStatusInput } from "../types/special-status.types.js";

const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 255;

/** StringValidator#validate(String value, int min, int max) equivalent. */
function isValidStringLength(value: unknown, min: number, max: number): boolean {
  if (typeof value !== "string") return false;
  const length = value.length;
  return length >= min && length <= max;
}

/** SpecialStatusValidator#validate(SpecialStatus entity) equivalent. */
export function validateSpecialStatus(entity: CreateSpecialStatusInput | UpdateSpecialStatusInput): boolean {
  return isValidStringLength(entity.name, NAME_MIN_LENGTH, NAME_MAX_LENGTH);
}
// @ts-nocheck
// @ts-nocheck
