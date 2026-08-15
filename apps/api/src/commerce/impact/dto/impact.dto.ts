import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateImpactFactorDto {
  @ApiPropertyOptional({ example: 3111882, description: "Workflow identifier" })
  @IsOptional()
  @IsNumber()
  workflowId?: number;

  @ApiPropertyOptional({ example: 128540, description: "Tenant identifier" })
  @IsOptional()
  @IsNumber()
  tenantId?: number;

  @ApiPropertyOptional({ example: 1311, description: "Order identifier" })
  @IsOptional()
  @IsNumber()
  orderId?: number;

  @ApiPropertyOptional({ example: 1312, description: "Order item identifier" })
  @IsOptional()
  @IsNumber()
  orderItemId?: number;

  @ApiProperty({ example: "FABRIC", description: "Product type (e.g. FABRIC, FINISHED)" })
  @IsNotEmpty()
  @IsString()
  productType!: string;

  @ApiPropertyOptional({ example: "COMPLETED", description: "Calculation status" })
  @IsOptional()
  @IsString()
  calculationStatus?: string;

  @ApiPropertyOptional({ example: "11.00", description: "Fabric meters" })
  @IsOptional()
  @IsString()
  fabricMeters?: string;

  @ApiPropertyOptional({ example: "9.00", description: "CO2 offset in kg" })
  @IsOptional()
  @IsString()
  co2OffsetKg?: string;

  @ApiPropertyOptional({ example: "19.00", description: "Water saved in litres" })
  @IsOptional()
  @IsString()
  waterSavedLitres?: string;

  @ApiPropertyOptional({ example: "7.00", description: "Artisan work hours" })
  @IsOptional()
  @IsString()
  artisanHours?: string;

  @ApiPropertyOptional({ example: "20.00", description: "Women artisan work hours" })
  @IsOptional()
  @IsString()
  womenArtisanHours?: string;

  @ApiPropertyOptional({ example: "15.00", description: "Stitching hours" })
  @IsOptional()
  @IsString()
  stitchingHours?: string;

  @ApiPropertyOptional({ example: "21.00", description: "Women stitching hours" })
  @IsOptional()
  @IsString()
  womenStitchingHours?: string;

  @ApiPropertyOptional({ example: "17.00", description: "Total work hours" })
  @IsOptional()
  @IsString()
  totalWorkHours?: string;
}

export class UpdateImpactFactorDto {
  @ApiProperty({ example: 1, description: "Impact factor ID to update" })
  @IsNotEmpty()
  @IsNumber()
  id!: number;

  @ApiPropertyOptional({ example: 3111882, description: "Workflow identifier" })
  @IsOptional()
  @IsNumber()
  workflowId?: number;

  @ApiPropertyOptional({ example: 128540, description: "Tenant identifier" })
  @IsOptional()
  @IsNumber()
  tenantId?: number;

  @ApiPropertyOptional({ example: 1311, description: "Order identifier" })
  @IsOptional()
  @IsNumber()
  orderId?: number;

  @ApiPropertyOptional({ example: 1312, description: "Order item identifier" })
  @IsOptional()
  @IsNumber()
  orderItemId?: number;

  @ApiPropertyOptional({ example: "FABRIC", description: "Product type" })
  @IsOptional()
  @IsString()
  productType?: string;

  @ApiPropertyOptional({ example: "COMPLETED", description: "Calculation status" })
  @IsOptional()
  @IsString()
  calculationStatus?: string;

  @ApiPropertyOptional({ example: "11.00", description: "Fabric meters" })
  @IsOptional()
  @IsString()
  fabricMeters?: string;

  @ApiPropertyOptional({ example: "9.00", description: "CO2 offset in kg" })
  @IsOptional()
  @IsString()
  co2OffsetKg?: string;

  @ApiPropertyOptional({ example: "19.00", description: "Water saved in litres" })
  @IsOptional()
  @IsString()
  waterSavedLitres?: string;

  @ApiPropertyOptional({ example: "7.00", description: "Artisan work hours" })
  @IsOptional()
  @IsString()
  artisanHours?: string;

  @ApiPropertyOptional({ example: "20.00", description: "Women artisan work hours" })
  @IsOptional()
  @IsString()
  womenArtisanHours?: string;

  @ApiPropertyOptional({ example: "15.00", description: "Stitching hours" })
  @IsOptional()
  @IsString()
  stitchingHours?: string;

  @ApiPropertyOptional({ example: "21.00", description: "Women stitching hours" })
  @IsOptional()
  @IsString()
  womenStitchingHours?: string;

  @ApiPropertyOptional({ example: "17.00", description: "Total work hours" })
  @IsOptional()
  @IsString()
  totalWorkHours?: string;
}

export function parseImpactFactorInput(data: any): any {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid impact factor data");
  }
  return {
    ...(data.id !== undefined && { id: Number(data.id) }),
    ...(data.workflowId !== undefined && { workflowId: Number(data.workflowId) }),
    ...(data.tenantId !== undefined && { tenantId: Number(data.tenantId) }),
    ...(data.orderId !== undefined && { orderId: Number(data.orderId) }),
    ...(data.orderItemId !== undefined && { orderItemId: Number(data.orderItemId) }),
    ...(data.productType !== undefined && { productType: String(data.productType) }),
    ...(data.calculationStatus !== undefined && { calculationStatus: String(data.calculationStatus) }),
    ...(data.pendingReason !== undefined && { pendingReason: String(data.pendingReason) }),
    ...(data.fabricMeters !== undefined && { fabricMeters: String(data.fabricMeters) }),
    ...(data.co2OffsetKg !== undefined && { co2OffsetKg: String(data.co2OffsetKg) }),
    ...(data.waterSavedLitres !== undefined && { waterSavedLitres: String(data.waterSavedLitres) }),
    ...(data.artisanHours !== undefined && { artisanHours: String(data.artisanHours) }),
    ...(data.womenArtisanHours !== undefined && { womenArtisanHours: String(data.womenArtisanHours) }),
    ...(data.stitchingHours !== undefined && { stitchingHours: String(data.stitchingHours) }),
    ...(data.womenStitchingHours !== undefined && { womenStitchingHours: String(data.womenStitchingHours) }),
    ...(data.totalWorkHours !== undefined && { totalWorkHours: String(data.totalWorkHours) }),
  };
}
