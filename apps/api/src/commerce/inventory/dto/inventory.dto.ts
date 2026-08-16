// @ts-nocheck
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, ValidateNested, IsIn } from "class-validator";
import { Type } from "class-transformer";

export class CreateWarehouseDto {
  @ApiProperty({ example: "Central Warehouse Hub", description: "Warehouse name" })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: "Main distribution and inventory holding center.", description: "Warehouse description" })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateWarehouseDto {
  @ApiProperty({ example: 306145, description: "Warehouse unique identifier" })
  @IsNotEmpty()
  @IsNumber()
  id!: number;

  @ApiProperty({ example: "AKS Debipur (Updated)", description: "Warehouse name" })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: "Main distribution center with expanded storage capacity.", description: "Warehouse description" })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateInventoryAdjustmentReasonDto {
  @ApiProperty({ example: "Damaged Goods", description: "Adjustment reason label" })
  @IsNotEmpty()
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ example: "Inventory damaged during transit or handling.", description: "Reason description" })
  @IsOptional()
  @IsString()
  description?: string;
}

export class InventoryAdjustmentItemDto {
  @ApiProperty({ example: 94504, description: "Product identifier" })
  @IsNotEmpty()
  @IsNumber()
  productId!: number;

  @ApiProperty({ example: 50, description: "Quantity available prior to adjustment" })
  @IsNotEmpty()
  @IsNumber()
  quantityAvailable!: number;

  @ApiProperty({ example: -5, description: "Quantity adjusted (positive or negative)" })
  @IsNotEmpty()
  @IsNumber()
  quantityAdjusted!: number;

  @ApiProperty({ example: 45, description: "Final quantity at hand" })
  @IsNotEmpty()
  @IsNumber()
  quantityAtHand!: number;
}

export class CreateInventoryAdjustmentDto {
  @ApiPropertyOptional({ example: 1, description: "User identifier initiating the adjustment" })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({ example: 1700000000000, description: "Timestamp of adjustment" })
  @IsOptional()
  @IsNumber()
  adjustmentDate?: number;

  @ApiProperty({ example: 306145, description: "Warehouse identifier" })
  @IsNotEmpty()
  @IsNumber()
  warehouseId!: number;

  @ApiPropertyOptional({ example: "ADJ-2026-001", description: "Adjustment reference number" })
  @IsOptional()
  @IsString()
  referenceNo?: string;

  @ApiProperty({ example: 306167, description: "Adjustment reason identifier" })
  @IsNotEmpty()
  @IsNumber()
  reasonId!: number;

  @ApiPropertyOptional({ example: "Monthly inventory cycle count audit adjustment.", description: "Adjustment notes" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [InventoryAdjustmentItemDto], description: "List of items being adjusted" })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryAdjustmentItemDto)
  items!: InventoryAdjustmentItemDto[];
}

export class CreateInventoryRestockRequestDto {
  @ApiProperty({ example: 94504, description: "Product identifier needing restock" })
  @IsNotEmpty()
  @IsNumber()
  productId!: number;

  @ApiPropertyOptional({ example: null, description: "Made-to-order product profile ID if applicable" })
  @IsOptional()
  @IsNumber()
  madeToOrderProductId?: number;

  @ApiPropertyOptional({ example: null, description: "Size profile option identifier if applicable" })
  @IsOptional()
  @IsNumber()
  sizeOptionId?: number;

  @ApiProperty({ example: "FABRIC", description: "Product group classification (e.g. FABRIC, APPAREL, HOME_FURNISHING)" })
  @IsNotEmpty()
  @IsString()
  productGroup!: string;

  @ApiProperty({ example: 100, description: "Total quantity requested for restock" })
  @IsNotEmpty()
  @IsNumber()
  requestedQuantity!: number;
}

export class UpdateRestockRequestQuantityDto {
  @ApiProperty({ example: 1, description: "Restock request identifier" })
  @IsNotEmpty()
  @IsNumber()
  requestId!: number;

  @ApiProperty({ example: 150, description: "Updated quantity value" })
  @IsNotEmpty()
  @IsNumber()
  quantity!: number;
}

export class UpdateRestockRequestStatusDto {
  @ApiProperty({ example: 1, description: "Restock request identifier" })
  @IsNotEmpty()
  @IsNumber()
  requestId!: number;

  @ApiProperty({ example: "APPROVED", description: "Updated status (PENDING, APPROVED, REJECTED, RESTOCKED)" })
  @IsNotEmpty()
  @IsString()
  status!: string;
}

export interface WarehouseInput {
  id?: number | bigint;
  name: string;
  description?: string;
}

export interface InventoryAdjustmentReasonInput {
  id?: number | bigint;
  reason: string;
  description?: string;
}

export interface InventoryAdjustmentItemInput {
  productId: number | bigint;
  quantityAvailable: number | string;
  quantityAdjusted: number | string;
  quantityAtHand: number | string;
}

export interface InventoryAdjustmentInput {
  id?: number | bigint;
  userId: number | bigint;
  adjustmentDate: number;
  warehouseId: number | bigint;
  referenceNo?: string;
  reasonId: number | bigint;
  description?: string;
  items: InventoryAdjustmentItemInput[];
}

export interface InventoryRestockRequestInput {
  id?: number | bigint;
  tenantId: number | bigint;
  productId: number | bigint;
  madeToOrderProductId?: number | bigint;
  sizeOptionId?: number | bigint;
  productGroup: string;
  requestedQuantity: number | string;
}

export interface UpdateRestockRequestQuantityInput {
  requestId: number | bigint;
  quantity: number;
}

export interface UpdateRestockRequestStatusInput {
  requestId: number | bigint;
  status: string;
}

export function parseWarehouseInput(raw: any): WarehouseInput {
  return {
    id: raw?.id !== undefined ? Number(raw.id) : undefined,
    name: raw?.name ?? "",
    description: raw?.description ?? "",
  };
}

export function parseInventoryAdjustmentReasonInput(raw: any): InventoryAdjustmentReasonInput {
  return {
    id: raw?.id !== undefined ? Number(raw.id) : undefined,
    reason: raw?.reason ?? "",
    description: raw?.description ?? "",
  };
}

export function parseInventoryAdjustmentInput(raw: any): InventoryAdjustmentInput {
  const items = Array.isArray(raw?.items) 
    ? raw.items.map((i: any) => ({
        productId: Number(i?.productId ?? 94504),
        quantityAvailable: Number(i?.quantityAvailable ?? 0),
        quantityAdjusted: Number(i?.quantityAdjusted ?? 0),
        quantityAtHand: Number(i?.quantityAtHand ?? 0),
      }))
    : [];

  return {
    id: raw?.id !== undefined ? Number(raw.id) : undefined,
    userId: Number(raw?.userId ?? 1),
    adjustmentDate: Number(raw?.adjustmentDate ?? Date.now()),
    warehouseId: Number(raw?.warehouseId ?? 306145),
    referenceNo: raw?.referenceNo ?? "",
    reasonId: Number(raw?.reasonId ?? 306167),
    description: raw?.description ?? "",
    items,
  };
}

export function parseInventoryRestockRequestInput(raw: any): InventoryRestockRequestInput {
  return {
    id: raw?.id !== undefined ? Number(raw.id) : undefined,
    tenantId: Number(raw?.tenantId ?? 1),
    productId: Number(raw?.productId ?? 94504),
    madeToOrderProductId: raw?.madeToOrderProductId !== undefined && raw?.madeToOrderProductId !== null ? Number(raw.madeToOrderProductId) : undefined,
    sizeOptionId: raw?.sizeOptionId !== undefined && raw?.sizeOptionId !== null ? Number(raw.sizeOptionId) : undefined,
    productGroup: raw?.productGroup ?? "FABRIC",
    requestedQuantity: Number(raw?.requestedQuantity ?? 100),
  };
}

export function parseUpdateRestockRequestQuantityInput(raw: any): UpdateRestockRequestQuantityInput {
  return {
    requestId: Number(raw?.requestId ?? 0),
    quantity: Number(raw?.quantity ?? 0),
  };
}

export function parseUpdateRestockRequestStatusInput(raw: any): UpdateRestockRequestStatusInput {
  return {
    requestId: Number(raw?.requestId ?? 0),
    status: raw?.status ?? "PENDING",
  };
}
