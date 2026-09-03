import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BadRequestException } from "@nestjs/common";
import { parseCreateProductRequest, parseUpdateProductRequest } from "../../product/dto/product.dto.js";
import { parseIdParamStrict, parseSlugParamStrict } from "../../../../common/params/id-param.js";
import { FinishedProductInput, ProductDisableRequest, ProductZohoTriggerData } from "../types/finished-product.types.js";

export class CreateFinishedProductDto {
  @ApiProperty({ example: "Handwoven Silk Scarf", description: "Product Name" })
  name!: string;

  @ApiProperty({ example: 1200, description: "Price" })
  price!: number;

  @ApiPropertyOptional({ example: "SILK-SCARF-01", description: "SKU" })
  sku?: string;

  @ApiPropertyOptional({ example: 3527, description: "SubCategory ID (e.g. 3527, 3531)" })
  subCategoryId?: number;

  @ApiPropertyOptional({ example: 2576, description: "SKU Group ID (e.g. 2576)" })
  skuGroupId?: number;
}

export class UpdateFinishedProductDto {
  @ApiProperty({ example: 2728, description: "Finished Product ID (e.g. 2728, 3071, 3644)" })
  id!: number;

  @ApiPropertyOptional({ example: "A-Line Panel Dress | Solid White", description: "Product Name" })
  name?: string;

  @ApiPropertyOptional({ example: 1683, description: "Price" })
  price?: number;
}

export class ProductDisableRequestDto {
  @ApiProperty({ example: 2728, description: "Product ID to enable/disable (e.g. 2728)" })
  productId!: number;

  @ApiProperty({ example: false, description: "Disabled status" })
  disabled!: boolean;
}

export class ProductZohoTriggerDto {
  @ApiProperty({ example: 2728, description: "Product ID to re-trigger Zoho workflow" })
  productId!: number;
}

function requireInt(value: unknown, field: string): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n)) {
    throw new BadRequestException(`${field} must be an integer.`);
  }
  return n;
}

/**
 * Path ids go through the shared strict parser (common/params/id-param.ts):
 * digits-only on the RAW string, converted with BigInt(string) so nothing is
 * rounded on the way through Number(). The local `requireInt` below stays for
 * JSON body fields, where an integer legitimately arrives as a number.
 */
export function parseProductIdParam(param: unknown): bigint {
  return parseIdParamStrict(param, "productId");
}

export function parseProductSlugParam(param: unknown): string {
  return parseSlugParamStrict(param, "productSlug");
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
