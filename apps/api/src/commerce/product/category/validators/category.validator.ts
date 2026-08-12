// @ts-nocheck
/**
 * apps/api/src/commerce/product/category/validators/category.validator.ts
 *
 * Direct, rule-for-rule port of com.bloomscorp.loom.product.category.validator.CategoryValidator.
 *
 * Source rules (verbatim from validate()):
 *  1. name length must be between 1 and 255 characters (StringValidator.validate(name, 1, 255))
 *  2. iconFile, if present, must pass optional image validation
 *  3. socialImageFile, if present, must pass optional image validation
 *
 * com.bloomscorp.loom.nverse.validator.StringValidator / ImageValidator are
 * external (not present in this repository). Their exact behavior isn't
 * verifiable, so:
 *  - the length check is reproduced directly (min/max inclusive char count,
 *    the only documented behavior of a StringValidator.validate(str, min, max)
 *    call site);
 *  - "validateOptionalImage" is approximated as: absent/null passes, else
 *    the file's mimetype must start with "image/". This is a conservative
 *    stand-in, NOT verified against the live ImageValidator — flagged for
 *    confirmation before shipping, same caveat pattern as Cart's sanitizer.
 */
import { CategoryInput, UploadedFile } from "../types/category.types.js";

function isValidNameLength(name: string, min: number, max: number): boolean {
  return typeof name === "string" && name.length >= min && name.length <= max;
}

function validateOptionalImage(file: UploadedFile | null | undefined): boolean {
  if (file === null || file === undefined) return true;
  return typeof file.mimetype === "string" && file.mimetype.startsWith("image/");
}

export function validateCategory(entity: CategoryInput): boolean {
  return (
    isValidNameLength(entity.name, 1, 255) &&
    validateOptionalImage(entity.iconFile) &&
    validateOptionalImage(entity.socialImageFile)
  );
}
// @ts-nocheck
// @ts-nocheck
