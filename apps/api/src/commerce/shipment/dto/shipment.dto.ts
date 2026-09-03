import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { LocationType } from "../types/shipment.types.js";

export class CreateShipmentDto {
  @ApiProperty({ example: "Standard Express Shipping", description: "Shipment method name" })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 150, description: "Base shipment charge amount" })
  @IsNotEmpty()
  @IsNumber()
  baseAmount!: number;

  @ApiProperty({ example: 1, description: "Base quantity included in base amount" })
  @IsNotEmpty()
  @IsNumber()
  baseQuantity!: number;

  @ApiProperty({ example: 50, description: "Additional amount per extra unit" })
  @IsNotEmpty()
  @IsNumber()
  additionalAmount!: number;

  @ApiProperty({ example: 3, description: "Estimated delivery start day" })
  @IsNotEmpty()
  @IsNumber()
  estimatedFromDay!: number;

  @ApiProperty({ example: 7, description: "Estimated delivery end day" })
  @IsNotEmpty()
  @IsNumber()
  estimatedToDay!: number;

  @ApiProperty({ enum: ["DOMESTIC", "INTERNATIONAL"], example: "DOMESTIC", description: "Location type classification" })
  @IsNotEmpty()
  @IsString()
  locationType!: LocationType;
}

export class UpdateShipmentDto {
  @ApiProperty({ example: 21209, description: "Shipment ID to update" })
  @IsNotEmpty()
  @IsNumber()
  id!: number;

  @ApiProperty({ example: "Regular - By Road (Updated)", description: "Shipment method name" })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 150, description: "Base shipment charge amount" })
  @IsNotEmpty()
  @IsNumber()
  baseAmount!: number;

  @ApiProperty({ example: 1, description: "Base quantity included in base amount" })
  @IsNotEmpty()
  @IsNumber()
  baseQuantity!: number;

  @ApiProperty({ example: 50, description: "Additional amount per extra unit" })
  @IsNotEmpty()
  @IsNumber()
  additionalAmount!: number;

  @ApiProperty({ example: 3, description: "Estimated delivery start day" })
  @IsNotEmpty()
  @IsNumber()
  estimatedFromDay!: number;

  @ApiProperty({ example: 7, description: "Estimated delivery end day" })
  @IsNotEmpty()
  @IsNumber()
  estimatedToDay!: number;

  @ApiProperty({ enum: ["DOMESTIC", "INTERNATIONAL"], example: "DOMESTIC", description: "Location type classification" })
  @IsNotEmpty()
  @IsString()
  locationType!: LocationType;
}

export interface ShipmentInput {
  id?: bigint | number;
  name: string;
  baseAmount: number;
  baseQuantity: number;
  additionalAmount: number;
  estimatedFromDay: number;
  estimatedToDay: number;
  locationType: LocationType;
}

export function parseShipmentInput(raw: unknown): ShipmentInput {
  const obj = (raw || {}) as Record<string, unknown>;
  
  return {
    id: typeof obj.id === "number" || typeof obj.id === "bigint" || typeof obj.id === "string" ? BigInt(obj.id) : undefined,
    name: typeof obj.name === "string" ? obj.name : "",
    baseAmount: typeof obj.baseAmount === "number" ? obj.baseAmount : (obj.baseAmount ? Number(obj.baseAmount) : 0),
    baseQuantity: typeof obj.baseQuantity === "number" ? obj.baseQuantity : (obj.baseQuantity ? Number(obj.baseQuantity) : 0),
    additionalAmount: typeof obj.additionalAmount === "number" ? obj.additionalAmount : (obj.additionalAmount ? Number(obj.additionalAmount) : 0),
    estimatedFromDay: typeof obj.estimatedFromDay === "number" ? obj.estimatedFromDay : (obj.estimatedFromDay ? Number(obj.estimatedFromDay) : 0),
    estimatedToDay: typeof obj.estimatedToDay === "number" ? obj.estimatedToDay : (obj.estimatedToDay ? Number(obj.estimatedToDay) : 0),
    locationType: typeof obj.locationType === "string" && Object.values(LocationType).includes(obj.locationType as LocationType) 
      ? (obj.locationType as LocationType) 
      : LocationType.DOMESTIC,
  };
}
