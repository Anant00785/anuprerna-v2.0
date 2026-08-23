// @ts-nocheck
import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { ProductSizeProfileInput } from "../types/product-size-profile.types.js";

export class CreateProductSizeProfileDto {
  @ApiProperty({ example: 107260025, description: "Parent Product ID" })
  @IsNotEmpty()
  @IsNumber()
  productId!: number;

  @ApiProperty({ example: 12562710, description: "Size Profile Option ID" })
  @IsNotEmpty()
  @IsNumber()
  sizeProfileOptionId!: number;

  @ApiProperty({ example: "WCS264480700004-S", description: "Size option SKU" })
  @IsNotEmpty()
  @IsString()
  sizeProfileOptionSku!: string;

  @ApiProperty({ example: 10, description: "Available stock quantity" })
  @IsNotEmpty()
  @IsNumber()
  quantity!: number;

  @ApiPropertyOptional({ example: 2.5, description: "Fabric consumed (meters) for impact calculation" })
  @IsOptional()
  @IsNumber()
  consumedFabric?: number;

  @ApiPropertyOptional({ example: false, description: "Disabled status" })
  @IsOptional()
  @IsBoolean()
  disabled?: boolean;
}

export class UpdateProductSizeProfileDto {
  @ApiProperty({ example: 161702936, description: "Product size profile unique ID" })
  @IsNotEmpty()
  @IsNumber()
  id!: number;

  @ApiProperty({ example: 107260025, description: "Parent Product ID" })
  @IsNotEmpty()
  @IsNumber()
  productId!: number;

  @ApiProperty({ example: 12562710, description: "Size Profile Option ID" })
  @IsNotEmpty()
  @IsNumber()
  sizeProfileOptionId!: number;

  @ApiProperty({ example: "WCS264480700004-S", description: "Size option SKU" })
  @IsNotEmpty()
  @IsString()
  sizeProfileOptionSku!: string;

  @ApiProperty({ example: 10, description: "Available stock quantity" })
  @IsNotEmpty()
  @IsNumber()
  quantity!: number;

  @ApiPropertyOptional({ example: 2.5, description: "Fabric consumed (meters) for impact calculation" })
  @IsOptional()
  @IsNumber()
  consumedFabric?: number;

  @ApiPropertyOptional({ example: false, description: "Disabled status" })
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

function requireOptionalNumber(value: unknown, field: string): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || Number.isNaN(n)) {
    throw new BadRequestException(`${field} must be a number.`);
  }
  return n;
}

export interface TableExplorerPageQuery {
  page: number;
  size: number;
}

/** retrieveProductSizeProfileData(int page, int size) */
export function parseTableExplorerPageQuery(query: unknown): TableExplorerPageQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  const page = q.page !== undefined && q.page !== "" ? requireInt(q.page, "page") : 1;
  const size = q.size !== undefined && q.size !== "" ? requireInt(q.size, "size") : 10;
  if (page < 0) throw new BadRequestException("page must be >= 0.");
  if (size < 1) throw new BadRequestException("size must be >= 1.");
  return { page, size };
}

/** retrieveProductSizeProfileById(Long id) / retrieveProductSizeProfileDataById(Long id) */
export function parseIdParam(id: unknown): number {
  return requireInt(id, "id");
}

/** deleteProductSizeProfileItems(Product product) — resolves by product id */
export function parseProductIdParam(productId: unknown): number {
  return requireInt(productId, "productId");
}

/**
 * getProductSizeProfileBySizeOption / deleteProductSizeProfileBySizeOption
 * (SizeProfileOption option) — resolves by size profile option id.
 */
export function parseSizeProfileOptionIdParam(sizeProfileOptionId: unknown): number {
  return requireInt(sizeProfileOptionId, "sizeProfileOptionId");
}

/**
 * retrieveConsumedFabricForImpact(Long productId, Long sizeProfileOptionId)
 */
export interface ConsumedFabricForImpactQuery {
  productId: number;
  sizeProfileOptionId: number;
}

export function parseConsumedFabricForImpactQuery(query: unknown): ConsumedFabricForImpactQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  return {
    productId: requireInt(q.productId, "productId"),
    sizeProfileOptionId: requireInt(q.sizeProfileOptionId, "sizeProfileOptionId"),
  };
}

/** Shared body parsing for create/update — matches the persisted entity shape exactly. */
function parseProductSizeProfileInput(body: unknown): ProductSizeProfileInput {
  const b = (body ?? {}) as Record<string, unknown>;

  return {
    id: b.id === undefined ? undefined : requireInt(b.id, "id"),
    productId: requireInt(b.productId, "productId"),
    sizeProfileOptionId: requireInt(b.sizeProfileOptionId, "sizeProfileOptionId"),
    sizeProfileOptionSku: requireNonEmptyString(b.sizeProfileOptionSku, "sizeProfileOptionSku"),
    quantity: requireInt(b.quantity, "quantity"),
    consumedFabric: requireOptionalNumber(b.consumedFabric, "consumedFabric"),
    disabled: b.disabled === undefined ? undefined : Boolean(b.disabled),
  };
}

export type CreateProductSizeProfileRequest = ProductSizeProfileInput;

export function parseCreateProductSizeProfileRequest(body: unknown): CreateProductSizeProfileRequest {
  return parseProductSizeProfileInput(body);
}

export interface UpdateProductSizeProfileRequest extends ProductSizeProfileInput {
  id: number; // required for update, unlike create
}

export function parseUpdateProductSizeProfileRequest(body: unknown): UpdateProductSizeProfileRequest {
  const parsed = parseProductSizeProfileInput(body);
  if (parsed.id === undefined) {
    throw new BadRequestException("id is required to update a product size profile.");
  }
  return parsed as UpdateProductSizeProfileRequest;
}
