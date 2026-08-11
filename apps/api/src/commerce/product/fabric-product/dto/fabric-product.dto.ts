import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BadRequestException } from "@nestjs/common";
import { parseCreateProductRequest, parseUpdateProductRequest } from "../../product/dto/product.dto.js";
import { FabricFilterPreviewFilters, FabricProductInput, ProductDisableRequestInput, ProductZohoTriggerDataInput } from "../types/fabric-product.types.js";

export class CreateFabricProductDto {
  @ApiProperty({ example: "Handwoven Khadi Fabric 100", description: "Product Name" })
  name!: string;

  @ApiProperty({ example: 540, description: "Price per meter" })
  price!: number;

  @ApiPropertyOptional({ example: "KHADI-100", description: "SKU" })
  sku?: string;

  @ApiPropertyOptional({ example: 11026725, description: "SubCategory ID" })
  subCategoryId?: number;
}

export class UpdateFabricProductDto {
  @ApiProperty({ example: 156298614, description: "Fabric Product ID" })
  id!: number;

  @ApiPropertyOptional({ example: "Handwoven Khadi Fabric 100", description: "Product Name" })
  name?: string;

  @ApiPropertyOptional({ example: 550, description: "Price per meter" })
  price?: number;
}

export class DisableProductDto {
  @ApiProperty({ example: 156298614, description: "Product ID to enable/disable" })
  productId!: number;

  @ApiProperty({ example: true, description: "Disabled status" })
  disabled!: boolean;
}

export class ZohoTriggerDto {
  @ApiProperty({ example: 156298614, description: "Product ID to re-trigger Zoho workflow" })
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

export function parseCreateFabricProductRequest(raw: unknown): FabricProductInput {
  const obj = raw as Record<string, unknown>;
  const productInput = parseCreateProductRequest(obj.product ?? raw);
  return {
    product: productInput,
    gsm: typeof obj.gsm === "number" ? obj.gsm : 100,
    width: typeof obj.width === "string" ? obj.width : "44 inch",
    addToSwatch: Boolean(obj.addToSwatch),
  };
}

export function parseUpdateFabricProductRequest(raw: unknown): FabricProductInput {
  const obj = raw as Record<string, unknown>;
  const productInput = parseUpdateProductRequest(obj.product ?? raw);
  return {
    product: productInput,
    gsm: typeof obj.gsm === "number" ? obj.gsm : 100,
    width: typeof obj.width === "string" ? obj.width : "44 inch",
    addToSwatch: Boolean(obj.addToSwatch),
  };
}

export function parseProductDisableRequest(raw: unknown): ProductDisableRequestInput {
  const obj = raw as Record<string, unknown>;
  return {
    productId: requireInt(obj.productId, "productId"),
    disable: Boolean(obj.disabled ?? obj.disable),
  };
}

export function parseProductZohoTriggerData(raw: unknown): ProductZohoTriggerDataInput {
  const obj = raw as Record<string, unknown>;
  return {
    productId: requireInt(obj.productId, "productId"),
    productZohoRelationList: Array.isArray(obj.productZohoRelationList) ? obj.productZohoRelationList : [],
  };
}

export function parsePageQuery(query: unknown): { page: number; size: number } {
  const obj = (query ?? {}) as Record<string, unknown>;
  const page = obj.page !== undefined ? Number(obj.page) : 0;
  const size = obj.size !== undefined ? Number(obj.size) : 20;
  return { page, size };
}

export function parseFabricFilterPreviewQuery(query: unknown): { categoryName?: string; segmentCategoryName?: string } {
  const obj = (query ?? {}) as Record<string, unknown>;
  return {
    categoryName: typeof obj.categoryName === "string" ? obj.categoryName : undefined,
    segmentCategoryName: typeof obj.segmentCategoryName === "string" ? obj.segmentCategoryName : undefined,
  };
}

export function parseFabricFilterPreviewPageQuery(query: unknown): { categoryName?: string; segmentCategoryName?: string; limit: number; offset: number } {
  const obj = (query ?? {}) as Record<string, unknown>;
  return {
    categoryName: typeof obj.categoryName === "string" ? obj.categoryName : undefined,
    segmentCategoryName: typeof obj.segmentCategoryName === "string" ? obj.segmentCategoryName : undefined,
    limit: obj.limit !== undefined ? Number(obj.limit) : 20,
    offset: obj.offset !== undefined ? Number(obj.offset) : 0,
  };
}

export function parseFabricFilterPreviewIds(idsParam: unknown): number[] {
  if (typeof idsParam !== "string") return [];
  return idsParam.split(",").map(s => Number(s.trim())).filter(n => !Number.isNaN(n));
}

export function parseFabricFilterPreviewFilters(query: unknown): FabricFilterPreviewFilters {
  const obj = (query ?? {}) as Record<string, unknown>;
  return {
    colors: typeof obj.colors === "string" ? obj.colors : null,
    materials: typeof obj.materials === "string" ? obj.materials : null,
    patterns: typeof obj.patterns === "string" ? obj.patterns : null,
    limit: obj.limit !== undefined ? Number(obj.limit) : 20,
    offset: obj.offset !== undefined ? Number(obj.offset) : 0,
  };
}
