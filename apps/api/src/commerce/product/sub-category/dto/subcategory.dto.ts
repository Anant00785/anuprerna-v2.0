// @ts-nocheck
import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsArray } from "class-validator";
import { Type } from "class-transformer";
import { CreateSubCategoryInput, UpdateSubCategoryInput, UploadedFile } from "../types/sub-category.types.js";

export class CreateSubCategoryDto {
  @ApiProperty({ example: 66059, description: "Segment ID (e.g. 66059, 167890, 31862)" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  segmentId!: number;

  @ApiProperty({ example: "ORGANIC COTTON TOPS", description: "SubCategory Name" })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: "Organic Cotton Tops – Handcrafted Fashion | Anuprerna", description: "Meta Title" })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional({ example: "Discover handcrafted organic cotton tops by Anuprerna.", description: "Meta Description" })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({ example: true, description: "Whether sub-category is featured" })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  featured?: boolean;

  @ApiPropertyOptional({ example: 143257, description: "Badge Profile ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  badgeProfileId?: number;

  @ApiPropertyOptional({ example: 377305, description: "Made to Order Profile ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  madeToOrderProfileId?: number;

  @ApiPropertyOptional({ example: 80977, description: "Volume Discount Profile ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  volumeDiscountProfileId?: number;

  @ApiPropertyOptional({ example: 376959, description: "Size Profile ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sizeProfileId?: number;

  @ApiPropertyOptional({ example: 129454572, description: "Fabric Profile ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fabricProfileId?: number;

  @ApiPropertyOptional({ type: "string", format: "binary", description: "Icon image file" })
  @IsOptional()
  iconFile?: any;

  @ApiPropertyOptional({ type: "string", format: "binary", description: "Social share image file" })
  @IsOptional()
  socialImageFile?: any;

  @ApiPropertyOptional({ type: "string", format: "binary", description: "Featured banner image file" })
  @IsOptional()
  featuredImageFile?: any;
}

export class UpdateSubCategoryDto {
  @ApiPropertyOptional({ example: 167890, description: "Segment ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  segmentId?: number;

  @ApiPropertyOptional({ example: "JACKETS", description: "SubCategory Name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "Unisex Jackets – Sustainable & Handcrafted Outerwear | Anuprerna", description: "Meta Title" })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional({ example: "Shop Anuprerna’s collection of unisex jackets.", description: "Meta Description" })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({ example: true, description: "Whether sub-category is featured" })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  featured?: boolean;

  @ApiPropertyOptional({ example: 143257, description: "Badge Profile ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  badgeProfileId?: number;

  @ApiPropertyOptional({ example: 377305, description: "Made to Order Profile ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  madeToOrderProfileId?: number;

  @ApiPropertyOptional({ example: 80977, description: "Volume Discount Profile ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  volumeDiscountProfileId?: number;

  @ApiPropertyOptional({ example: 376959, description: "Size Profile ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sizeProfileId?: number;

  @ApiPropertyOptional({ example: 129454572, description: "Fabric Profile ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fabricProfileId?: number;

  @ApiPropertyOptional({ type: "string", format: "binary", description: "Icon image file" })
  @IsOptional()
  iconFile?: any;

  @ApiPropertyOptional({ type: "string", format: "binary", description: "Social share image file" })
  @IsOptional()
  socialImageFile?: any;

  @ApiPropertyOptional({ type: "string", format: "binary", description: "Featured banner image file" })
  @IsOptional()
  featuredImageFile?: any;
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
  if (value === null || value === "") return null;
  return requireInt(value, field);
}

function parseOptionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new BadRequestException(`${field} must be a boolean.`);
}

function parseOptionalFile(value: unknown, field: string): UploadedFile | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const v = value as Record<string, unknown>;
  if (!Buffer.isBuffer(v.buffer) || typeof v.originalName !== "string" || typeof v.mimeType !== "string") {
    return undefined;
  }
  return v as unknown as UploadedFile;
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

export function parseIdParam(id: unknown): number {
  return requireInt(id, "id");
}

export function parseSubCategoryIdParam(subCategoryId: unknown): number {
  return requireInt(subCategoryId, "subCategoryId");
}

export function parseCategoryNameParam(categoryName: unknown): string {
  return requireNonEmptyString(categoryName, "categoryName");
}

export function parseCreateSubCategoryRequest(body: unknown): CreateSubCategoryInput {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    segmentId: requireInt(b.segmentId ?? 66059, "segmentId"),
    name: requireNonEmptyString(b.name ?? "SUB CATEGORY", "name"),
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

export function parseUpdateSubCategoryRequest(body: unknown, subCategoryId: unknown): UpdateSubCategoryInput {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    id: requireInt(subCategoryId, "subCategoryId"),
    segmentId: parseOptionalInt(b.segmentId, "segmentId") ?? 0,
    name: parseOptionalString(b.name, "name") ?? "",
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
