import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ProductImageGallerySEO } from "../types/seo.types.js";

export class ProductImageGallerySEOItemDto {
  @ApiPropertyOptional({ example: 1, description: "Gallery SEO record ID if updating existing" })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({ example: 94504, description: "Product unique ID" })
  @IsNotEmpty()
  @IsNumber()
  productId!: number;

  @ApiProperty({ example: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/sample_image.jpg", description: "Image URL" })
  @IsNotEmpty()
  @IsString()
  image!: string;

  @ApiProperty({ example: "Handwoven Organic Khadi Fabric Gallery Image", description: "SEO Alt Text" })
  @IsNotEmpty()
  @IsString()
  altText!: string;

  @ApiPropertyOptional({ example: false, description: "Whether this image SEO record is marked deleted" })
  @IsOptional()
  @IsBoolean()
  deleted?: boolean;
}

export class ModifyGalleryImagesDto {
  @ApiProperty({ example: 94504, description: "Product unique ID" })
  @IsNotEmpty()
  @IsNumber()
  productId!: number;

  @ApiProperty({ type: [ProductImageGallerySEOItemDto], description: "List of gallery image SEO metadata" })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageGallerySEOItemDto)
  gallerySEOList!: ProductImageGallerySEOItemDto[];
}

export interface ProductImageGallerySEOPayload {
    productId: number;
    gallerySEOList: ProductImageGallerySEO[];
}

export function parseProductImageGallerySEOPayload(raw: unknown): ProductImageGallerySEOPayload {
    const obj = (raw || {}) as Record<string, unknown>;
    
    let gallerySEOList: ProductImageGallerySEO[] = [];
    if (Array.isArray(obj.gallerySEOList)) {
        gallerySEOList = obj.gallerySEOList.map((item: any) => ({
            id: typeof item.id === "string" || typeof item.id === "number" || typeof item.id === "bigint" ? Number(item.id) : 0,
            version: typeof item.version === "string" || typeof item.version === "number" || typeof item.version === "bigint" ? Number(item.version) : 0,
            productId: typeof item.productId === "string" || typeof item.productId === "number" || typeof item.productId === "bigint" ? Number(item.productId) : Number(obj.productId ?? 0),
            image: typeof item.image === "string" ? item.image : "",
            altText: typeof item.altText === "string" ? item.altText : "",
            deleted: typeof item.deleted === "boolean" ? item.deleted : false
        }));
    }

    return {
        productId: typeof obj.productId === "string" || typeof obj.productId === "number" || typeof obj.productId === "bigint" ? Number(obj.productId) : 0,
        gallerySEOList
    };
}
