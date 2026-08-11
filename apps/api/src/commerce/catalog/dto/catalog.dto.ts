import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCatalogDto {
  @ApiProperty({ example: "Summer Silk & Cotton Collection 2026", description: "Name of the catalog" })
  name!: string;

  @ApiPropertyOptional({ example: "Curated collection of eco-friendly handloom silk and cotton fabrics.", description: "Description" })
  description?: string;

  @ApiPropertyOptional({ example: 101, description: "Artisan ID" })
  artisanId?: number;
}

export class UpdateCatalogDto {
  @ApiProperty({ example: 1001, description: "Primary Key ID of catalog" })
  id!: number;

  @ApiProperty({ example: "Summer Silk & Cotton Collection 2026 (Updated)", description: "Name of the catalog" })
  name?: string;

  @ApiPropertyOptional({ example: "Updated description for summer collection.", description: "Description" })
  description?: string;

  @ApiPropertyOptional({ example: 101, description: "Artisan ID" })
  artisanId?: number;
}

export class CreateCatalogItemDto {
  @ApiProperty({ example: "Handwoven Organic Cotton Fabric Swatch", description: "Title of the catalog item" })
  title!: string;

  @ApiPropertyOptional({ example: "Authentic handloom artisan woven organic cotton fabric sample.", description: "Description" })
  description?: string;

  @ApiPropertyOptional({ example: 450, description: "Price of the catalog item" })
  price?: number;

  @ApiPropertyOptional({ example: "HCS-001", description: "Stock Keeping Unit Code" })
  sku?: string;

  @ApiPropertyOptional({ example: 101, description: "Artisan ID" })
  artisanId?: number;

  @ApiPropertyOptional({ example: 2558, description: "Category ID" })
  categoryId?: number;

  @ApiPropertyOptional({ example: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/sample.jpg", description: "Hero Image URL" })
  heroImage?: string;
}

export class UpdateCatalogItemDto {
  @ApiProperty({ example: 157423010, description: "Primary Key ID of catalog item" })
  id!: number;

  @ApiPropertyOptional({ example: "Handwoven Organic Cotton Fabric Swatch", description: "Title of the catalog item" })
  title?: string;

  @ApiPropertyOptional({ example: "Updated authentic handloom artisan woven organic cotton fabric sample.", description: "Description" })
  description?: string;

  @ApiPropertyOptional({ example: 500, description: "Updated price" })
  price?: number;

  @ApiPropertyOptional({ example: "HCS-001-REV", description: "Stock Keeping Unit Code" })
  sku?: string;

  @ApiPropertyOptional({ example: 101, description: "Artisan ID" })
  artisanId?: number;

  @ApiPropertyOptional({ example: 2558, description: "Category ID" })
  categoryId?: number;
}

export class GenerateCatalogPdfDto {
  @ApiProperty({ example: 1001, description: "Catalog ID to generate PDF for" })
  catalogId!: number;

  @ApiPropertyOptional({ example: "A4", description: "PDF Page Format (A4 / Letter)" })
  format?: string;
}

export class CreateCatalogItemMediaDto {
  @ApiProperty({ example: 157423010, description: "Catalog Item ID" })
  catalogItemId!: number;

  @ApiProperty({ example: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/media-sample.jpg", description: "Media URL" })
  mediaUrl!: string;

  @ApiPropertyOptional({ example: "IMAGE", description: "Media Type (IMAGE / VIDEO)" })
  mediaType?: string;
}

export interface CatalogInput {
  id?: bigint;
  name: string;
}

export function parseCatalogInput(raw: unknown): CatalogInput {
  const obj = raw as Record<string, unknown>;
  return {
    name: typeof obj.name === "string" ? obj.name : "",
  };
}
