import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BadRequestException } from "@nestjs/common";
import { parseCreateProductRequest, parseUpdateProductRequest } from "../../product/dto/product.dto.js";
import { FinishedProductInput, ProductDisableRequest, ProductZohoTriggerData } from "../types/finished-product.types.js";

export class CreateFinishedProductDto {
  @ApiProperty({ example: "Handwoven Silk Scarf", description: "Product Name" })
  name!: string;

  @ApiProperty({ example: 1200, description: "Price" })
  price!: number;

  @ApiPropertyOptional({ example: "SILK-SCARF-01", description: "SKU" })
  sku?: string;

  @ApiPropertyOptional({ example: 11026725, description: "SubCategory ID" })
  subCategoryId?: number;
}

export class UpdateFinishedProductDto {
  @ApiProperty({ example: 156298620, description: "Finished Product ID" })
  id!: number;

  @ApiPropertyOptional({ example: "Handwoven Silk Scarf", description: "Product Name" })
  name?: string;

  @ApiPropertyOptional({ example: 1300, description: "Price" })
  price?: number;
}

export class ProductDisableRequestDto {
  @ApiProperty({ example: 156298620, description: "Product ID to enable/disable" })
  productId!: number;

  @ApiProperty({ example: true, description: "Disabled status" })
  disabled!: boolean;
}

export class ProductZohoTriggerDto {
  @ApiProperty({ example: 156298620, description: "Product ID to re-trigger Zoho workflow" })
  productId!: number;
}

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

export function parseProductIdParam(param: unknown): number {
  return requireInt(param, "productId");
}

export function parseProductSlugParam(param: unknown): string {
  return requireNonEmptyString(param, "productSlug");
}

export function parseCreateFinishedProductRequest(raw: unknown): FinishedProductInput {
  const obj = raw as Record<string, unknown>;
  const productInput = parseCreateProductRequest(obj.product ?? raw);
  return {
    product: productInput,
  };
}

export function parseUpdateFinishedProductRequest(raw: unknown): FinishedProductInput {
  const obj = raw as Record<string, unknown>;
  const productInput = parseUpdateProductRequest(obj.product ?? raw);
  return {
    product: productInput,
  };
}

export function parseProductDisableRequest(raw: unknown): ProductDisableRequest {
  const obj = raw as Record<string, unknown>;
  return {
    productId: requireInt(obj.productId, "productId"),
    disable: Boolean(obj.disabled ?? obj.disable),
  };
}

export function parseProductZohoTriggerData(raw: unknown): ProductZohoTriggerData {
  const obj = raw as Record<string, unknown>;
  return {
    productId: requireInt(obj.productId, "productId"),
    productZohoRelationList: Array.isArray(obj.productZohoRelationList) ? obj.productZohoRelationList : [],
  };
}

export function parseTableExplorerPageQuery(query: unknown): { page: number; size: number } {
  const obj = (query ?? {}) as Record<string, unknown>;
  const page = obj.page !== undefined ? Number(obj.page) : 0;
  const size = obj.size !== undefined ? Number(obj.size) : 20;
  return { page, size };
}
