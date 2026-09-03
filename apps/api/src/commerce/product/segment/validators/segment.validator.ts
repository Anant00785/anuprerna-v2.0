/**
 * apps/api/src/commerce/product/segment/validators/segment.validator.ts
 *
 * SegmentController wires `com.bloomscorp.loom.nverse.validator.SegmentValidator`
 * — NOT a local `product.segment.validator` class the way Category has its
 * own `CategoryValidator`. That nverse-package class is entirely external
 * to this repository (unlike CategoryValidator, which was fully readable
 * source), so its exact rule set can't be transcribed.
 *
 * What follows is a same-shape validator inferred from the entity's own
 * constraints (`Segment.name` NOT NULL VARCHAR, `Segment.category` NOT
 * NULL/`optional = false`, transient icon/socialImage files), mirroring
 * the sibling CategoryValidator's rule pattern (name length 1-255,
 * optional-image checks) plus a categoryId presence check the ORM's
 * `@ManyToOne(optional = false)` requires at the database level. This is
 * flagged as INFERRED, not source-verified — confirm against the live
 * `com.bloomscorp.loom.nverse.validator.SegmentValidator` before shipping.
 */
import { SegmentInput, UploadedFile } from "../types/segment.types.js";

function isValidNameLength(name: string, min: number, max: number): boolean {
  return typeof name === "string" && name.length >= min && name.length <= max;
}

function validateOptionalImage(file: UploadedFile | null | undefined): boolean {
  if (file === null || file === undefined) return true;
  return typeof file.mimetype === "string" && file.mimetype.startsWith("image/");
}

function isValidCategoryId(categoryId: unknown): boolean {
  return typeof categoryId === "number" && Number.isInteger(categoryId) && categoryId > 0;
}

export function validateSegment(entity: SegmentInput): boolean {
  return (
    isValidCategoryId(entity.categoryId) &&
    isValidNameLength(entity.name, 1, 255) &&
    validateOptionalImage(entity.iconFile) &&
    validateOptionalImage(entity.socialImageFile)
  );
}
