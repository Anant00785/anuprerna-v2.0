import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { ProductZohoRelationInput } from "../types/product-zoho-relation.types.js";

export class CreateProductZohoRelationDto {
  @ApiProperty({ example: 200415, description: "Parent Product ID" })
  @IsNotEmpty()
  @IsNumber()
  productId!: number;

  @ApiProperty({ example: "DAN1200458", description: "Product SKU code" })
  @IsNotEmpty()
  @IsString()
  sku!: string;

  @ApiPropertyOptional({ example: "460517000010726810", description: "Zoho inventory item ID" })
  @IsOptional()
  @IsString()
  zohoItemId?: string;

  @ApiPropertyOptional({ example: "52091220", description: "HSN classification code" })
  @IsOptional()
  @IsString()
  hsnCode?: string;

  @ApiPropertyOptional({ example: 350.0, description: "Purchase cost price" })
  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @ApiProperty({ example: 5.0, description: "GST / Tax percentage rate" })
  @IsNotEmpty()
  @IsNumber()
  tax!: number;

  @ApiPropertyOptional({ example: false, description: "Disabled status flag" })
  @IsOptional()
  @IsBoolean()
  disabled?: boolean;
}

export class UpdateProductZohoRelationDto {
  @ApiProperty({ example: 200417, description: "Product Zoho relation unique ID" })
  @IsNotEmpty()
  @IsNumber()
  id!: number;

  @ApiProperty({ example: 200415, description: "Parent Product ID" })
  @IsNotEmpty()
  @IsNumber()
  productId!: number;

  @ApiProperty({ example: "DAN1200458", description: "Product SKU code" })
  @IsNotEmpty()
  @IsString()
  sku!: string;

  @ApiPropertyOptional({ example: "460517000010726810", description: "Zoho inventory item ID" })
  @IsOptional()
  @IsString()
  zohoItemId?: string;

  @ApiPropertyOptional({ example: "52091220", description: "HSN classification code" })
  @IsOptional()
  @IsString()
  hsnCode?: string;

  @ApiPropertyOptional({ example: 350.0, description: "Purchase cost price" })
  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @ApiProperty({ example: 5.0, description: "GST / Tax percentage rate" })
  @IsNotEmpty()
  @IsNumber()
  tax!: number;

  @ApiPropertyOptional({ example: false, description: "Disabled status flag" })
  @IsOptional()
  @IsBoolean()
  disabled?: boolean;
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

function requireNumber(value: unknown, field: string): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || Number.isNaN(n)) {
    throw new BadRequestException(`${field} must be a number.`);
  }
  return n;
}

function requireOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new BadRequestException(`${field} must be a string.`);
  return value;
}

function requireOptionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined;
  return requireNumber(value, field);
}

export interface TableExplorerPageQuery {
  page: number;
  size: number;
}

/** retrieveProductZohoRelationData(int page, int size) */
export function parseTableExplorerPageQuery(query: unknown): TableExplorerPageQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  const page = q.page !== undefined && q.page !== "" ? requireInt(q.page, "page") : 1;
  const size = q.size !== undefined && q.size !== "" ? requireInt(q.size, "size") : 10;
  if (page < 0) throw new BadRequestException("page must be >= 0.");
  if (size < 1) throw new BadRequestException("size must be >= 1.");
  return { page, size };
}

/** retrieveProductZohoRelationById(Long id) / retrieveProductZohoRelationDataById(Long id) / deleteProductZohoRelation(Long id) */
export function parseIdParam(id: unknown): number {
  return requireInt(id, "id");
}

/** findProductZohoRelationByProductAndSku(Product product, String sku) */
export interface ProductAndSkuQuery {
  productId: number;
  sku: string;
}

export function parseProductAndSkuQuery(query: unknown): ProductAndSkuQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  return {
    productId: requireInt(q.productId, "productId"),
    sku: requireNonEmptyString(q.sku, "sku"),
  };
}

/** findProductZohoRelationByZohoItemIdAndSku(String zohoItemId, String sku) */
export interface ZohoItemIdAndSkuQuery {
  zohoItemId: string;
  sku: string;
}

export function parseZohoItemIdAndSkuQuery(query: unknown): ZohoItemIdAndSkuQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  return {
    zohoItemId: requireNonEmptyString(q.zohoItemId, "zohoItemId"),
    sku: requireNonEmptyString(q.sku, "sku"),
  };
}

/** findProductZohoRelationByZohoItemId(String zohoItemId) */
export function parseZohoItemIdParam(zohoItemId: unknown): string {
  return requireNonEmptyString(zohoItemId, "zohoItemId");
}

/** streamAllByFinishedProduct(boolean) / streamAllByFabricProduct(boolean) */
export function parseIncludeDisabledParam(includeDisabled: unknown): boolean {
  if (includeDisabled === undefined) return false;
  if (typeof includeDisabled === "boolean") return includeDisabled;
  if (includeDisabled === "true") return true;
  if (includeDisabled === "false") return false;
  throw new BadRequestException("includeDisabled must be a boolean.");
}

/** Shared body parsing for create/update — matches the persisted entity shape exactly. */
function parseProductZohoRelationInput(body: unknown): ProductZohoRelationInput {
  const b = (body ?? {}) as Record<string, unknown>;

  return {
    id: b.id === undefined ? undefined : requireInt(b.id, "id"),
    productId: requireInt(b.productId, "productId"),
    sku: requireNonEmptyString(b.sku, "sku"),
    zohoItemId: requireOptionalString(b.zohoItemId, "zohoItemId"),
    hsnCode: requireOptionalString(b.hsnCode, "hsnCode"),
    purchasePrice: requireOptionalNumber(b.purchasePrice, "purchasePrice"),
    tax: requireNumber(b.tax, "tax"),
    disabled: b.disabled === undefined ? undefined : Boolean(b.disabled),
  };
}

export type CreateProductZohoRelationRequest = ProductZohoRelationInput;

export function parseCreateProductZohoRelationRequest(body: unknown): CreateProductZohoRelationRequest {
  return parseProductZohoRelationInput(body);
}

export interface UpdateProductZohoRelationRequest extends ProductZohoRelationInput {
  id: number; // required for update, unlike create
}

export function parseUpdateProductZohoRelationRequest(body: unknown): UpdateProductZohoRelationRequest {
  const parsed = parseProductZohoRelationInput(body);
  if (parsed.id === undefined) {
    throw new BadRequestException("id is required to update a product Zoho relation.");
  }
  return parsed as UpdateProductZohoRelationRequest;
}
