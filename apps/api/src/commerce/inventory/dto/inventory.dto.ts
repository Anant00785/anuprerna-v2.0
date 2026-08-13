import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, ValidateNested } from "class-validator";
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
  @ApiProperty({ example: 1, description: "Warehouse unique identifier" })
  @IsNotEmpty()
  @IsNumber()
  id!: number;

  @ApiProperty({ example: "Central Warehouse Hub (Updated)", description: "Warehouse name" })
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
  @ApiProperty({ example: 2590, description: "Product identifier" })
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

  @ApiProperty({ example: 1, description: "Warehouse identifier" })
  @IsNotEmpty()
  @IsNumber()
  warehouseId!: number;

  @ApiPropertyOptional({ example: "ADJ-2026-001", description: "Adjustment reference number" })
  @IsOptional()
  @IsString()
  referenceNo?: string;

  @ApiProperty({ example: 1, description: "Adjustment reason identifier" })
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
  @ApiProperty({ example: 2590, description: "Product identifier needing restock" })
  @IsNotEmpty()
  @IsNumber()
  productId!: number;

  @ApiPropertyOptional({ example: 12, description: "Made-to-order product profile ID if applicable" })
  @IsOptional()
  @IsNumber()
  madeToOrderProductId?: number;

  @ApiPropertyOptional({ example: 3, description: "Size profile option identifier if applicable" })
  @IsOptional()
  @IsNumber()
  sizeOptionId?: number;

  @ApiProperty({ example: "FABRIC", description: "Product group (FABRIC, FINISHED)" })
  @IsNotEmpty()
  @IsString()
  productGroup!: string;

  @ApiProperty({ example: 100, description: "Requested restock quantity" })
  @IsNotEmpty()
  @IsNumber()
  requestedQuantity!: number;
}

export class UpdateRestockRequestQuantityDto {
  @ApiProperty({ example: 1, description: "Restock request identifier" })
  @IsNotEmpty()
  @IsNumber()
  requestId!: number;

  @ApiProperty({ example: 150, description: "New updated quantity requested" })
  @IsNotEmpty()
  @IsNumber()
  quantity!: number;
}

export class UpdateRestockRequestStatusDto {
  @ApiProperty({ example: 1, description: "Restock request identifier" })
  @IsNotEmpty()
  @IsNumber()
  requestId!: number;

  @ApiProperty({ example: "APPROVED", description: "Restock request status (e.g. APPROVED, REJECTED, FULFILLED)" })
  @IsNotEmpty()
  @IsString()
  status!: string;
}

export interface WarehouseInput {
  id?: bigint;
  name: string;
  description: string;
}

export function parseWarehouseInput(raw: unknown): WarehouseInput {
  const obj = (raw || {}) as Record<string, unknown>;
  return {
    id: obj.id !== undefined && obj.id !== null ? BigInt(obj.id as any) : undefined,
    name: typeof obj.name === 'string' ? obj.name : '',
    description: typeof obj.description === 'string' ? obj.description : '',
  };
}

export interface InventoryAdjustmentReasonInput {
  id?: bigint;
  reason: string;
  description: string;
}

export function parseInventoryAdjustmentReasonInput(raw: unknown): InventoryAdjustmentReasonInput {
  const obj = (raw || {}) as Record<string, unknown>;
  return {
    id: obj.id !== undefined && obj.id !== null ? BigInt(obj.id as any) : undefined,
    reason: typeof obj.reason === 'string' ? obj.reason : '',
    description: typeof obj.description === 'string' ? obj.description : '',
  };
}

export interface InventoryAdjustmentItemInput {
  productId: bigint;
  quantityAvailable: number;
  quantityAdjusted: number;
  quantityAtHand: number;
}

export interface InventoryAdjustmentInput {
  userId: bigint;
  adjustmentDate: number;
  warehouseId: bigint;
  referenceNo: string;
  reasonId: bigint;
  description: string;
  items: InventoryAdjustmentItemInput[];
}

export function parseInventoryAdjustmentInput(raw: unknown): InventoryAdjustmentInput {
  const obj = (raw || {}) as Record<string, unknown>;
  const itemsRaw = Array.isArray(obj.items) ? obj.items : [];
  return {
    userId: obj.userId !== undefined && obj.userId !== null ? BigInt(obj.userId as any) : BigInt(0),
    adjustmentDate: typeof obj.adjustmentDate === 'number' ? obj.adjustmentDate : Date.now(),
    warehouseId: obj.warehouseId !== undefined && obj.warehouseId !== null ? BigInt(obj.warehouseId as any) : BigInt(0),
    referenceNo: typeof obj.referenceNo === 'string' ? obj.referenceNo : '',
    reasonId: obj.reasonId !== undefined && obj.reasonId !== null ? BigInt(obj.reasonId as any) : BigInt(0),
    description: typeof obj.description === 'string' ? obj.description : '',
    items: itemsRaw.map((i: any) => ({
      productId: i.productId !== undefined && i.productId !== null ? BigInt(i.productId as any) : BigInt(0),
      quantityAvailable: typeof i.quantityAvailable === 'number' ? i.quantityAvailable : 0,
      quantityAdjusted: typeof i.quantityAdjusted === 'number' ? i.quantityAdjusted : 0,
      quantityAtHand: typeof i.quantityAtHand === 'number' ? i.quantityAtHand : 0,
    })),
  };
}

export interface InventoryRestockRequestInput {
  tenantId: bigint;
  productId: bigint;
  madeToOrderProductId?: bigint;
  sizeOptionId?: bigint;
  productGroup: string;
  requestedQuantity: number;
}

export function parseInventoryRestockRequestInput(raw: unknown): InventoryRestockRequestInput {
  const obj = (raw || {}) as Record<string, unknown>;
  return {
    tenantId: obj.tenantId !== undefined && obj.tenantId !== null ? BigInt(obj.tenantId as any) : BigInt(0),
    productId: obj.productId !== undefined && obj.productId !== null ? BigInt(obj.productId as any) : BigInt(0),
    madeToOrderProductId: obj.madeToOrderProductId !== undefined && obj.madeToOrderProductId !== null ? BigInt(obj.madeToOrderProductId as any) : undefined,
    sizeOptionId: obj.sizeOptionId !== undefined && obj.sizeOptionId !== null ? BigInt(obj.sizeOptionId as any) : undefined,
    productGroup: typeof obj.productGroup === 'string' ? obj.productGroup : '',
    requestedQuantity: typeof obj.requestedQuantity === 'number' ? obj.requestedQuantity : 0,
  };
}

export interface UpdateRestockRequestQuantityInput {
  requestId: bigint;
  quantity: number;
}

export function parseUpdateRestockRequestQuantityInput(raw: unknown): UpdateRestockRequestQuantityInput {
  const obj = (raw || {}) as Record<string, unknown>;
  return {
    requestId: obj.requestId !== undefined && obj.requestId !== null ? BigInt(obj.requestId as any) : BigInt(0),
    quantity: typeof obj.quantity === 'number' ? obj.quantity : 0,
  };
}

export interface UpdateRestockRequestStatusInput {
  requestId: bigint;
  status: string;
}

export function parseUpdateRestockRequestStatusInput(raw: unknown): UpdateRestockRequestStatusInput {
  const obj = (raw || {}) as Record<string, unknown>;
  return {
    requestId: obj.requestId !== undefined && obj.requestId !== null ? BigInt(obj.requestId as any) : BigInt(0),
    status: typeof obj.status === 'string' ? obj.status : '',
  };
}
