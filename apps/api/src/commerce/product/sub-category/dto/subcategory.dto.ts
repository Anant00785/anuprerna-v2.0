// @ts-nocheck
/**
 * apps/api/src/product/sub_category/SubCategory.dto.ts
 *
 * Request DTOs, one per SubCategory endpoint. Field sets mirror the
 * corresponding SubCategoryController / SubCategoryPreviewController
 * handler parameters exactly:
 *  - getSubCategory(subCategoryId)
 *  - createNewSubCategory(subCategory: SubCategory)         [multipart/form-data]
 *  - updateSubCategory(updatedSubCategory: SubCategory, subCategoryId)
 *  - deleteSubCategory(subCategoryId)
 *  - getFeaturedSubCategories(categoryName)
 *  - getSubCategoryData(page, size)
 *  - getSubCategoryById(id)
 *  - getSubCategoryList()  [no body/query]
 *
 * No validation library (zod/class-validator) is installed in this project
 * (mirrors SkuGroup.dto.ts / commerce/cart/dto/cart.dto.ts exactly), so
 * parsing is done by hand rather than depending on a missing package.
 */
import { BadRequestException } from "@nestjs/common";
import { CreateSubCategoryInput, UpdateSubCategoryInput, UploadedFile } from "../types/sub-category.types.js";

function requireInt(value: unknown, field: string): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n)) {
    throw new BadRequestException(`${field} must be an integer.`);
  }
  return n;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BadRequestException(`${field} must be a non-empty string.`);
  }
  return value;
}

function parseOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new BadRequestException(`${field} must be a string.`);
  return value;
}

function parseOptionalNumber(value: unknown, field: string): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || Number.isNaN(n)) {
    throw new BadRequestException(`${field} must be a number.`);
  }
  return n;
}

function parseOptionalInt(value: unknown, field: string): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return requireInt(value, field);
}

function parseOptionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new BadRequestException(`${field} must be a boolean.`);
}

/** Minimal shape guard for the local UploadedFile representation. */
function parseOptionalFile(value: unknown, field: string): UploadedFile | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const v = value as Record<string, unknown>;
  if (!Buffer.isBuffer(v.buffer) || typeof v.originalName !== "string" || typeof v.mimeType !== "string") {
    throw new BadRequestException(`${field} must be an uploaded file.`);
  }
  return v as unknown as UploadedFile;
}

export interface TableExplorerPageQuery {
  page: number;
  size: number;
}

/** getSubCategoryData(@RequestParam int page, @RequestParam int size) */
export function parseTableExplorerPageQuery(query: unknown): TableExplorerPageQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  const page = q.page !== undefined && q.page !== "" ? requireInt(q.page, "page") : 1;
  const size = q.size !== undefined && q.size !== "" ? requireInt(q.size, "size") : 10;
  if (page < 0) throw new BadRequestException("page must be >= 0.");
  if (size < 1) throw new BadRequestException("size must be >= 1.");
  return { page, size };
}

/** getSubCategory(@PathVariable Long subCategoryId) / getSubCategoryById(@PathVariable Long id) */
export function parseIdParam(id: unknown): number {
  return requireInt(id, "id");
}

/** deleteSubCategory(@PathVariable Long subCategoryId) */
export function parseSubCategoryIdParam(subCategoryId: unknown): number {
  return requireInt(subCategoryId, "subCategoryId");
}

/** getFeaturedSubCategories(@PathVariable String categoryName) */
export function parseCategoryNameParam(categoryName: unknown): string {
  return requireNonEmptyString(categoryName, "categoryName");
}

/**
 * createNewSubCategory(@ModelAttribute SubCategory subCategory) — segmentId
 * is required (source has no null-guard before dereferencing it).
 */
export function parseCreateSubCategoryRequest(body: unknown): CreateSubCategoryInput {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    segmentId: requireInt(b.segmentId, "segmentId"),
    name: requireNonEmptyString(b.name, "name"),
    metaTitle: parseOptionalString(b.metaTitle, "metaTitle"),
    metaDescription: parseOptionalString(b.metaDescription, "metaDescription"),
    avgWorkHoursPerMeter: parseOptionalNumber(b.avgWorkHoursPerMeter, "avgWorkHoursPerMeter"),
    featured: parseOptionalBoolean(b.featured, "featured"),
    badgeProfileId: parseOptionalInt(b.badgeProfileId, "badgeProfileId"),
    madeToOrderProfileId: parseOptionalInt(b.madeToOrderProfileId, "madeToOrderProfileId"),
    volumeDiscountProfileId: parseOptionalInt(b.volumeDiscountProfileId, "volumeDiscountProfileId"),
    customSizeProfileId: parseOptionalInt(b.customSizeProfileId, "customSizeProfileId"),
    sizeProfileId: parseOptionalInt(b.sizeProfileId, "sizeProfileId"),
    finishProfileId: parseOptionalInt(b.finishProfileId, "finishProfileId"),
    fabricProfileId: parseOptionalInt(b.fabricProfileId, "fabricProfileId"),
    iconFile: parseOptionalFile(b.iconFile, "iconFile"),
    socialImageFile: parseOptionalFile(b.socialImageFile, "socialImageFile"),
    featuredImageFile: parseOptionalFile(b.featuredImageFile, "featuredImageFile"),
  };
}

/**
 * updateSubCategory(@ModelAttribute SubCategory updatedSubCategory,
 * @PathVariable Long subCategoryId) — id comes from the path, everything
 * else from the multipart body. `name`/`segmentId` are always required
 * because source overwrites them unconditionally on every update.
 */
export function parseUpdateSubCategoryRequest(body: unknown, subCategoryId: unknown): UpdateSubCategoryInput {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    id: requireInt(subCategoryId, "subCategoryId"),
    segmentId: requireInt(b.segmentId, "segmentId"),
    name: requireNonEmptyString(b.name, "name"),
    metaTitle: parseOptionalString(b.metaTitle, "metaTitle"),
    metaDescription: parseOptionalString(b.metaDescription, "metaDescription"),
    avgWorkHoursPerMeter: parseOptionalNumber(b.avgWorkHoursPerMeter, "avgWorkHoursPerMeter"),
    featured: parseOptionalBoolean(b.featured, "featured"),
    badgeProfileId: parseOptionalInt(b.badgeProfileId, "badgeProfileId"),
    madeToOrderProfileId: parseOptionalInt(b.madeToOrderProfileId, "madeToOrderProfileId"),
    volumeDiscountProfileId: parseOptionalInt(b.volumeDiscountProfileId, "volumeDiscountProfileId"),
    customSizeProfileId: parseOptionalInt(b.customSizeProfileId, "customSizeProfileId"),
    sizeProfileId: parseOptionalInt(b.sizeProfileId, "sizeProfileId"),
    finishProfileId: parseOptionalInt(b.finishProfileId, "finishProfileId"),
    fabricProfileId: parseOptionalInt(b.fabricProfileId, "fabricProfileId"),
    iconFile: parseOptionalFile(b.iconFile, "iconFile"),
    socialImageFile: parseOptionalFile(b.socialImageFile, "socialImageFile"),
    featuredImageFile: parseOptionalFile(b.featuredImageFile, "featuredImageFile"),
  };
}
