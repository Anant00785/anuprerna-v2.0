/**
 * apps/api/src/product/custom-product/dto/custom-product.dto.ts
 *
 * Request DTOs, one per CustomProduct endpoint. Field sets mirror the
 * corresponding CustomProductController handler parameters exactly:
 *  - getCustomProduct(productId)
 *  - getCustomProducts()               -> no body/query to parse
 *  - addCustomProduct(customProduct: CustomProduct)
 *  - updateCustomProduct(customProduct: CustomProduct)
 *  - getCustomProductData(page, size)
 *
 * No validation library (zod/class-validator) is installed in this project
 * (verified against package.json — same finding as Cart/FinishedProduct),
 * so parsing is done by hand rather than depending on a missing package.
 */
import { BadRequestException } from "@nestjs/common";
import { CustomProductInput, UNITS, Unit, UpdateCustomProductInput } from "../types/custom-product.types.js";

function requireInt(value: unknown, field: string): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n)) {
    throw new BadRequestException(`${field} must be an integer.`);
  }
  return n;
}

function requireNumber(value: unknown, field: string): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || Number.isNaN(n)) {
    throw new BadRequestException(`${field} must be a number.`);
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
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new BadRequestException(`${field} must be a string.`);
  return value;
}

function parseOptionalUnit(value: unknown): Unit | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !(UNITS as readonly string[]).includes(value)) {
    throw new BadRequestException(`unit must be one of ${UNITS.join(", ")}.`);
  }
  return value as Unit;
}

export interface TableExplorerPageQuery {
  page: number;
  size: number;
}

export function parseTableExplorerPageQuery(query: unknown): TableExplorerPageQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  const page = requireInt(q.page, "page");
  const size = requireInt(q.size, "size");
  if (page < 0) throw new BadRequestException("page must be >= 0.");
  if (size < 1) throw new BadRequestException("size must be >= 1.");
  return { page, size };
}

/** @PathVariable Long productId — used by getCustomProduct */
export function parseProductIdParam(productId: unknown): number {
  return requireInt(productId, "productId");
}

/** Shared body parsing for add/update — the request shape is identical (CustomProduct). */
function parseCustomProductInput(body: unknown): CustomProductInput {
  const b = (body ?? {}) as Record<string, unknown>;

  return {
    id: b.id === undefined ? undefined : requireInt(b.id, "id"),
    name: requireNonEmptyString(b.name, "name"),
    sku: requireNonEmptyString(b.sku, "sku"),
    price: requireNumber(b.price, "price"),
    productGroup: requireNonEmptyString(b.productGroup, "productGroup"),
    unit: parseOptionalUnit(b.unit),
    remarks: parseOptionalString(b.remarks, "remarks"),
    heroImage: parseOptionalString(b.heroImage, "heroImage"),
    additionalImages: parseOptionalString(b.additionalImages, "additionalImages"),
    additionalDocs: parseOptionalString(b.additionalDocs, "additionalDocs"),
  };
}

export type AddCustomProductRequest = CustomProductInput;

export function parseAddCustomProductRequest(body: unknown): AddCustomProductRequest {
  return parseCustomProductInput(body);
}

export function parseUpdateCustomProductRequest(body: unknown): UpdateCustomProductInput {
  const parsed = parseCustomProductInput(body);
  if (parsed.id === undefined) {
    throw new BadRequestException("id is required to update a custom product.");
  }
  return parsed as UpdateCustomProductInput;
}