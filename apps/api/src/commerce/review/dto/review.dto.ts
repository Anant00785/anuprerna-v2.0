import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateReviewDto {
  @ApiProperty({ example: "Sarah Jenkins", description: "Reviewer full name" })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: "London", description: "Reviewer city" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: "United Kingdom", description: "Reviewer country" })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: 5, description: "Review rating (1 to 5)" })
  @IsNotEmpty()
  @IsNumber()
  rating!: number;

  @ApiProperty({ example: "Beautiful handcrafted fabric with exceptional texture and quality.", description: "Review comment body" })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({ example: 2590, description: "Product identifier" })
  @IsNotEmpty()
  @IsNumber()
  productId!: number;

  @ApiPropertyOptional({ example: 101, description: "Associated order identifier" })
  @IsOptional()
  @IsNumber()
  orderId?: number;

  @ApiPropertyOptional({ example: 1011, description: "Associated order item identifier" })
  @IsOptional()
  @IsNumber()
  orderItemId?: number;

  @ApiPropertyOptional({ example: "https://anuprerna.com/images/review1.jpg", description: "Review gallery image URLs" })
  @IsOptional()
  @IsString()
  productImages?: string;

  @ApiPropertyOptional({ example: "https://anuprerna.com/products/khadi", description: "Review reference link" })
  @IsOptional()
  @IsString()
  link?: string;
}

export class UpdateCustomerReviewDto {
  @ApiProperty({ example: 424997, description: "Review unique identifier to update" })
  @IsNotEmpty()
  @IsNumber()
  id!: number;

  @ApiPropertyOptional({ example: "Sarah Jenkins", description: "Reviewer full name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "London", description: "Reviewer city" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: "United Kingdom", description: "Reviewer country" })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 5, description: "Review rating (1 to 5)" })
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional({ example: "Updated review description text.", description: "Review comment body" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "https://anuprerna.com/images/review_updated.jpg", description: "Review image URL" })
  @IsOptional()
  @IsString()
  productImages?: string;

  @ApiPropertyOptional({ example: "https://anuprerna.com/products/khadi", description: "Review reference link" })
  @IsOptional()
  @IsString()
  link?: string;
}

export class UpdateSuperUserReviewDto {
  @ApiProperty({ example: 1, description: "Review unique identifier" })
  @IsNotEmpty()
  @IsNumber()
  id!: number;

  @ApiProperty({ example: "APPROVED", description: "Review moderation status (e.g. APPROVED, REJECTED, PENDING)" })
  @IsNotEmpty()
  @IsString()
  status!: string;
}

export interface ReviewInput {
  id?: bigint;
  name?: string;
  city?: string;
  country?: string;
  rating?: number;
  description?: string;
  productId?: number;
  orderId?: number;
  orderItemId?: number;
  productImages?: string;
  status?: string;
  link?: string;
  createdAt?: number;
}

export function parseReviewInput(raw: unknown): ReviewInput {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const obj = raw as Record<string, unknown>;
  return {
    id: obj.id !== undefined && obj.id !== null ? BigInt(obj.id as any) : undefined,
    name: typeof obj.name === 'string' ? obj.name : undefined,
    city: typeof obj.city === 'string' ? obj.city : undefined,
    country: typeof obj.country === 'string' ? obj.country : undefined,
    rating: obj.rating !== undefined && obj.rating !== null ? Number(obj.rating) : undefined,
    description: typeof obj.description === 'string' ? obj.description : undefined,
    productId: obj.productId !== undefined && obj.productId !== null ? Number(obj.productId) : undefined,
    orderId: obj.orderId !== undefined && obj.orderId !== null ? Number(obj.orderId) : undefined,
    orderItemId: obj.orderItemId !== undefined && obj.orderItemId !== null ? Number(obj.orderItemId) : undefined,
    productImages: typeof obj.productImages === 'string' ? obj.productImages : undefined,
    status: typeof obj.status === 'string' ? obj.status : undefined,
    link: typeof obj.link === 'string' ? obj.link : undefined,
    createdAt: obj.createdAt !== undefined && obj.createdAt !== null ? Number(obj.createdAt) : undefined,
  };
}
