import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export interface OrderInput {
  customerId: bigint;
  addressId: bigint;
  paymentMode: string;
  notes?: string;
}

export function parseOrderInput(raw: unknown): OrderInput {
  const obj = raw as Record<string, unknown>;
  return {
    customerId: typeof obj.customerId === "string" || typeof obj.customerId === "number" ? BigInt(obj.customerId) : 0n,
    addressId: typeof obj.addressId === "string" || typeof obj.addressId === "number" ? BigInt(obj.addressId) : 0n,
    paymentMode: typeof obj.paymentMode === "string" ? obj.paymentMode : "",
    notes: typeof obj.notes === "string" ? obj.notes : undefined,
  };
}

export interface OrderUpdateInput {
  orderId: bigint;
  status: string;
}

export function parseOrderUpdateInput(raw: unknown): OrderUpdateInput {
  const obj = raw as Record<string, unknown>;
  return {
    orderId: typeof obj.orderId === "string" || typeof obj.orderId === "number" ? BigInt(obj.orderId) : 0n,
    status: typeof obj.status === "string" ? obj.status : "",
  };
}

export class UpdateOrderGlobalNoteDto {
  @ApiProperty({ example: 1, description: "Order ID" })
  @IsNotEmpty()
  @IsNumber()
  orderId!: number;

  @ApiProperty({ example: "Internal note: Priority processing requested for customer", description: "Internal staff global note text" })
  @IsNotEmpty()
  @IsString()
  globalNote!: string;
}

export class UpdateOrderShipmentDto {
  @ApiProperty({ example: 1, description: "Order ID" })
  @IsNotEmpty()
  @IsNumber()
  orderId!: number;

  @ApiPropertyOptional({ example: 1, description: "Shipment Provider ID" })
  @IsOptional()
  @IsNumber()
  shipmentId?: number;

  @ApiPropertyOptional({ example: "AWB12345678", description: "Shipping tracking code" })
  @IsOptional()
  @IsString()
  shippingCode?: string;

  @ApiPropertyOptional({ example: "https://tracking.carrier.com/AWB12345678", description: "Tracking URL" })
  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @ApiPropertyOptional({ example: "BlueDart", description: "Carrier / Service Provider name" })
  @IsOptional()
  @IsString()
  serviceProvider?: string;
}
