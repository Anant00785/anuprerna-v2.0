/**
 * Loom: forex-style CRUD payloads for custom_product.
 * Java source: product/controller/CustomProductController.java +
 * product/dao/controller/CustomProductDAOController.java
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class CreateCustomProductDto {
  @ApiProperty({ example: "Handwoven Cotton Stole" })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: "AP-CP-0001" })
  @IsNotEmpty()
  @IsString()
  sku!: string;

  @ApiProperty({ example: 1250.0 })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  price!: number;

  @ApiProperty({ example: "fabric", description: "fabric | finished" })
  @IsNotEmpty()
  @IsString()
  productGroup!: string;

  @ApiPropertyOptional({ example: "METER", description: "METER | UNIT" })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: "" })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ example: "https://cdn/hero.jpg" })
  @IsOptional()
  @IsString()
  heroImage?: string;

  @ApiPropertyOptional({ example: "https://cdn/a.jpg,https://cdn/b.jpg", description: "CSV, as Loom stores it" })
  @IsOptional()
  @IsString()
  additionalImages?: string;

  @ApiPropertyOptional({ example: "", description: "CSV, as Loom stores it" })
  @IsOptional()
  @IsString()
  additionalDocs?: string;
}

export class UpdateCustomProductDto extends CreateCustomProductDto {
  @ApiProperty({ example: 1, description: "Id of the custom product to update" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  id!: number;
}

export interface CustomProductInput {
  id?: number;
  name: string;
  sku: string;
  price: number;
  productGroup: string;
  unit: string;
  remarks: string;
  heroImage: string;
  additionalImages: string;
  additionalDocs: string;
}

/**
 * Loom derives unit from productGroup in the create form
 * (create-custom-product.component.ts prepareForm: fabric -> METER,
 * finished -> UNIT); an explicit unit still wins.
 */
export function parseCustomProductInput(raw: unknown): CustomProductInput {
  const r = (raw ?? {}) as Record<string, unknown>;
  const productGroup = String(r.productGroup ?? "").trim();
  const explicitUnit = String(r.unit ?? "").trim();
  return {
    id: r.id === undefined || r.id === null ? undefined : Number(r.id),
    name: String(r.name ?? "").trim(),
    sku: String(r.sku ?? "").trim(),
    price: Number(r.price ?? 0),
    productGroup,
    unit: explicitUnit || (productGroup === "finished" ? "UNIT" : "METER"),
    remarks: String(r.remarks ?? ""),
    heroImage: String(r.heroImage ?? ""),
    additionalImages: String(r.additionalImages ?? ""),
    additionalDocs: String(r.additionalDocs ?? ""),
  };
}

/** Loom: nverse/validator/CustomProductValidator — the required-field checks. */
export function validateCustomProduct(input: CustomProductInput): string | null {
  if (!input.name) return "Name is required.";
  if (!input.sku) return "SKU is required.";
  if (!input.productGroup) return "Product group is required.";
  if (!Number.isFinite(input.price) || input.price < 0) return "Price must be a non-negative number.";
  return null;
}
