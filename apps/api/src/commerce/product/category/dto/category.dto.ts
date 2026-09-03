/**
 * apps/api/src/commerce/product/category/dto/category.dto.ts
 *
 * Request DTOs, one per Category endpoint that isn't gated behind
 * RequestMapper (see module README / checkpoint — controller generation is
 * deferred until RequestMapper.java is available). Field sets mirror the
 * corresponding CategoryController handler parameters exactly:
 *  - getCategory(categoryId)
 *  - getCategoryList()
 *  - createNewCategory(category: Category)               [multipart]
 *  - updateCategory(updatedCategory: Category, categoryId) [multipart]
 *  - getCategoryData(page, size)
 *  - deleteCategory(categoryId)
 *
 * No validation library installed yet, same constraint as Cart — parsing
 * is done by hand rather than depending on a missing package.
 */
import { BadRequestException } from "@nestjs/common";
import { CategoryInput, UploadedFile } from "../types/category.types.js";

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

function parseOptionalFile(value: unknown): UploadedFile | null | undefined {
  if (value === undefined || value === null) return undefined;
  return value as UploadedFile;
}

export interface TableExplorerPageQuery {
  page: number;
  size: number;
}

export function parseTableExplorerPageQuery(query: unknown): TableExplorerPageQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  const page = q.page !== undefined && q.page !== "" ? Number(q.page) : 0;
  const size = q.size !== undefined && q.size !== "" ? Number(q.size) : 20;
  return { page: Math.max(0, isNaN(page) ? 0 : page), size: Math.max(1, isNaN(size) ? 20 : size) };
}

export function parseCategoryIdParam(categoryId: unknown): number {
  return requireInt(categoryId, "categoryId");
}

/** Shared multipart-body parsing for both create and update — the request shape is identical (Category). */
function parseCategoryInput(body: unknown, files: unknown): CategoryInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const f = (files ?? {}) as Record<string, unknown>;

  return {
    name: requireNonEmptyString(b.name, "name"),
    metaTitle: parseOptionalString(b.metaTitle, "metaTitle"),
    metaDescription: parseOptionalString(b.metaDescription, "metaDescription"),
    iconFile: parseOptionalFile(f.iconFile),
    socialImageFile: parseOptionalFile(f.socialImageFile),
  };
}

export type CreateCategoryRequest = CategoryInput;

export function parseCreateCategoryRequest(body: unknown, files: unknown): CreateCategoryRequest {
  return parseCategoryInput(body, files);
}

export type UpdateCategoryRequest = CategoryInput;

export function parseUpdateCategoryRequest(body: unknown, files: unknown): UpdateCategoryRequest {
  return parseCategoryInput(body, files);
}
