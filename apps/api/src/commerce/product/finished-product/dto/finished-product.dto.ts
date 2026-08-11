// @ts-nocheck
/**
 * apps/api/src/product/finished-product/dto/finished-product.dto.ts
 *
 * Request DTOs, one per FinishedProduct endpoint. Field sets mirror the
 * corresponding FinishedProductController handler parameters exactly:
 *  - getFinishedProduct(productId)
 *  - getFinishedProductBySlug(productSlug)
 *  - createFinishedProduct(finishedProduct: FinishedProduct)
 *  - updateFinishedProduct(finishedProduct: FinishedProduct)
 *  - disableFinishedProduct(productDisableRequest: ProductDisableRequest)
 *  - triggerZohoWorkflow(triggerData: ProductZohoTriggerData)
 *  - getProductFinishedData(page, size)
 *
 * No validation library (zod/class-validator) is installed in this project
 * (verified against package.json — same finding as the Cart module), so
 * parsing is done by hand rather than depending on a missing package.
 */
import { BadRequestException } from "@nestjs/common";
import {
  FinishedProductInput,
  ProductDisableRequest,
  ProductZohoRelationLite,
  ProductZohoTriggerData,
  UpdateFinishedProductInput,
} from "../types/finished-product.types.js";

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

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new BadRequestException(`${field} must be a boolean.`);
  }
  return value;
}

export interface TableExplorerPageQuery {
  page: number;
  size: number;
}

export function parseTableExplorerPageQuery(query: unknown): TableExplorerPageQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  const page = q.page !== undefined && q.page !== "" ? requireInt(q.page, "page") : 1;
  const size = q.size !== undefined && q.size !== "" ? requireInt(q.size, "size") : 10;
  if (page < 0) throw new BadRequestException("page must be >= 0.");
  if (size < 1) throw new BadRequestException("size must be >= 1.");
  return { page, size };
}

/** @PathVariable Long productId — used by getFinishedProduct */
export function parseProductIdParam(productId: unknown): number {
  return requireInt(productId, "productId");
}

/** @PathVariable String productSlug — used by getFinishedProductBySlug */
export function parseProductSlugParam(productSlug: unknown): string {
  return requireNonEmptyString(productSlug, "productSlug");
}

/**
 * Shared body parsing for create/update — source accepts the same
 * `FinishedProduct` shape for both (id absent/ignored on create). `product`
 * is deliberately left as an opaque payload here: its full shape belongs to
 * the Product module (see types/finished-product.types.ts header) and this
 * DTO layer does no more validation of it than "must be present" — the
 * actual product fields are the Product module's responsibility to parse.
 */
function parseFinishedProductInput(body: unknown): FinishedProductInput {
  const b = (body ?? {}) as Record<string, unknown>;
  if (b.product === undefined || b.product === null || typeof b.product !== "object") {
    throw new BadRequestException("product must be an object.");
  }
  return {
    id: b.id === undefined ? undefined : requireInt(b.id, "id"),
    product: b.product,
  };
}

export type CreateFinishedProductRequest = FinishedProductInput;

export function parseCreateFinishedProductRequest(body: unknown): CreateFinishedProductRequest {
  return parseFinishedProductInput(body);
}

export function parseUpdateFinishedProductRequest(body: unknown): UpdateFinishedProductInput {
  const parsed = parseFinishedProductInput(body);
  if (parsed.id === undefined) {
    throw new BadRequestException("id is required to update a finished product.");
  }
  return parsed as UpdateFinishedProductInput;
}

export function parseProductDisableRequest(body: unknown): ProductDisableRequest {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    productId: requireInt(b.productId, "productId"),
    disable: requireBoolean(b.disable, "disable"),
  };
}

function parseZohoRelationLite(value: unknown, index: number): ProductZohoRelationLite {
  const v = (value ?? {}) as Record<string, unknown>;
  return {
    id: requireInt(v.id, `productZohoRelationList[${index}].id`),
    sku: requireNonEmptyString(v.sku, `productZohoRelationList[${index}].sku`),
    disabled: requireBoolean(v.disabled, `productZohoRelationList[${index}].disabled`),
  };
}

export function parseProductZohoTriggerData(body: unknown): ProductZohoTriggerData {
  const b = (body ?? {}) as Record<string, unknown>;
  const list = Array.isArray(b.productZohoRelationList) ? b.productZohoRelationList : [];
  return {
    productId: requireInt(b.productId, "productId"),
    productZohoRelationList: list.map(parseZohoRelationLite),
  };
}
// @ts-nocheck
// @ts-nocheck
