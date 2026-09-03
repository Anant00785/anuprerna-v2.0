/**
 * apps/api/src/product/sku_group/SkuGroup.validator.ts
 *
 * Port of com.bloomscorp.loom.nverse.validator.SkuGroupValidator.
 *
 * IMPORTANT — source availability note: SkuGroupController references
 * `com.bloomscorp.loom.nverse.validator.SkuGroupValidator`, which lives in
 * the external `nverse` package and is NOT present in the uploaded
 * repository (unlike e.g. CategoryValidator, which lives in-module at
 * product.category.validator and IS present). This port is therefore
 * modeled on the one comparable in-repo validator that also guards a
 * single unique `name` column with the same StringValidator dependency —
 * product.category.validator.CategoryValidator:
 *
 *   return stringValidator.validate(entity.getName(), 1, 255);
 *
 * (CategoryValidator additionally validates two image fields that SkuGroup
 * doesn't have — icon/social image — so those are correctly omitted here,
 * not dropped.) The exact bounds SkuGroupValidator itself uses are NOT
 * confirmed against source; 1..255 mirrors both CategoryValidator's usage
 * and the `varchar(255)` column width on `sku_group.name` (schema.ts).
 * Confirm against the live nverse.validator.SkuGroupValidator before
 * shipping to production.
 */
import { CreateSkuGroupInput, UpdateSkuGroupInput } from "../types/sku-group.types.js";

const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 255;

/** StringValidator#validate(String value, int min, int max) equivalent. */
function isValidStringLength(value: unknown, min: number, max: number): boolean {
  if (typeof value !== "string") return false;
  const length = value.length;
  return length >= min && length <= max;
}

/** SkuGroupValidator#validate(SkuGroup entity) equivalent. */
export function validateSkuGroup(entity: CreateSkuGroupInput | UpdateSkuGroupInput): boolean {
  return isValidStringLength(entity.name, NAME_MIN_LENGTH, NAME_MAX_LENGTH);
}
