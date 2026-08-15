import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class CreateCatalogDto {
  @ApiProperty({ example: "Summer Silk & Cotton Collection 2026", description: "Name of the catalog" })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: "Curated collection of eco-friendly handloom silk and cotton fabrics.", description: "Description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 47906435, description: "Artisan ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  artisanId?: number;
}

export class UpdateCatalogDto {
  @ApiProperty({ example: 1001, description: "Primary Key ID of catalog" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  id!: number;

  @ApiPropertyOptional({ example: "Summer Silk & Cotton Collection 2026 (Updated)", description: "Name of the catalog" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "Updated description for summer collection.", description: "Description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 47906435, description: "Artisan ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  artisanId?: number;
}

export class CreateCatalogItemDto {
  @ApiProperty({ example: "Handwoven Organic Cotton Fabric Swatch", description: "Title of the catalog item" })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: "Authentic handloom artisan woven organic cotton fabric sample.", description: "Description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 450, description: "Price of the catalog item" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({ example: "HCS-001", description: "Stock Keeping Unit Code" })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: 47906435, description: "Artisan ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  artisanId?: number;

  @ApiPropertyOptional({ example: 2558, description: "Category ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoryId?: number;

  @ApiPropertyOptional({ example: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/sample.jpg", description: "Hero Image URL" })
  @IsOptional()
  @IsString()
  heroImage?: string;
}

export class UpdateCatalogItemDto {
  @ApiProperty({ example: 157423010, description: "Primary Key ID of catalog item" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  id!: number;

  @ApiPropertyOptional({ example: "Handwoven Organic Cotton Fabric Swatch", description: "Title of the catalog item" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: "Updated authentic handloom artisan woven organic cotton fabric sample.", description: "Description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 500, description: "Updated price" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({ example: "HCS-001-REV", description: "Stock Keeping Unit Code" })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: 47906435, description: "Artisan ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  artisanId?: number;

  @ApiPropertyOptional({ example: 2558, description: "Category ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoryId?: number;
}

export class GenerateCatalogPdfDto {
  @ApiProperty({ example: 1001, description: "Catalog ID to generate PDF for" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  catalogId!: number;

  @ApiPropertyOptional({ example: "A4", description: "PDF Page Format (A4 / Letter)" })
  @IsOptional()
  @IsString()
  format?: string;
}

export class CreateCatalogItemMediaDto {
  @ApiProperty({ example: 157423010, description: "Catalog Item ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  catalogItemId!: number;

  @ApiProperty({ example: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/media-sample.jpg", description: "Media URL" })
  @IsNotEmpty()
  @IsString()
  mediaUrl!: string;

  @ApiPropertyOptional({ example: "IMAGE", description: "Media Type (IMAGE / VIDEO)" })
  @IsOptional()
  @IsString()
  mediaType?: string;
}
