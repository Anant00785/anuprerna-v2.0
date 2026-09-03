/**
 * apps/api/src/product/sub_category/SubCategory.validator.ts
 *
 * Port of com.bloomscorp.loom.nverse.validator.SubCategoryValidator.
 *
 * IMPORTANT — source availability note: SubCategoryController references
 * `com.bloomscorp.loom.nverse.validator.SubCategoryValidator`, which lives
 * in the external `nverse` package and is NOT present in the uploaded
 * repository (same situation as SkuGroupValidator — see
 * SkuGroup.validator.ts for the identical caveat). This port is modeled on
 * the one comparable in-repo validator with the same dependency shape —
 * `product.category.validator.CategoryValidator`:
 *
 *   return stringValidator.validate(entity.getName(), 1, 255) &&
 *       this.imageValidator.validateOptionalImage(entity.getIconFile()) &&
 *       this.imageValidator.validateOptionalImage(entity.getSocialImageFile());
 *
 * SubCategory has a third optional image field CategoryValidator doesn't
 * (`featuredImageFile`) — extended here with the same
 * `validateOptionalImage` treatment, consistent with how the other two
 * fields are validated in source. `ImageValidator`'s exact internal rules
 * (allowed mime types, max size, etc.) are external and NOT in this
 * repository; `isValidOptionalImage` below is a conservative, flagged
 * stand-in (non-empty buffer + `image/*` mime type). Confirm against the
 * live nverse ImageValidator before shipping to production.
 */
import { CreateSubCategoryInput, UpdateSubCategoryInput, UploadedFile } from "../types/sub-category.types.js";

const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 255;

/** StringValidator#validate(String value, int min, int max) equivalent. */
function isValidStringLength(value: unknown, min: number, max: number): boolean {
  if (typeof value !== "string") return false;
  const length = value.length;
  return length >= min && length <= max;
}

/**
 * ImageValidator#validateOptionalImage(MultipartFile file) equivalent —
 * NOT source-verified (external class). "Optional" means absent/null is
 * valid; only a present-but-malformed file fails.
 */
function isValidOptionalImage(file: UploadedFile | null | undefined): boolean {
  if (file === null || file === undefined) return true;
  return file.buffer.length > 0 && file.mimetype.startsWith("image/");
}

/** SubCategoryValidator#validate(SubCategory entity) equivalent. */
export function validateSubCategory(entity: CreateSubCategoryInput | UpdateSubCategoryInput): boolean {
  return (
    isValidStringLength(entity.name, NAME_MIN_LENGTH, NAME_MAX_LENGTH) &&
    isValidOptionalImage(entity.iconFile) &&
    isValidOptionalImage(entity.socialImageFile) &&
    isValidOptionalImage(entity.featuredImageFile)
  );
}
