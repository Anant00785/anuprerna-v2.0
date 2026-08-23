import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export interface OrderInput {
  customerId: bigint;
  addressId: bigint;
  paymentMode: string;
  notes?: string;
}

export function parseOrderInput(raw: unknown): OrderInput {
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    customerId: typeof obj.customerId === "string" || typeof obj.customerId === "number" ? BigInt(obj.customerId) : 1n,
    addressId: typeof obj.addressId === "string" || typeof obj.addressId === "number" ? BigInt(obj.addressId) : 1n,
    paymentMode: typeof obj.paymentMode === "string" ? obj.paymentMode : "ONLINE",
    notes: typeof obj.notes === "string" ? obj.notes : undefined,
  };
}

export interface OrderUpdateInput {
  orderId: bigint;
  status: string;
}

export function parseOrderUpdateInput(raw: unknown): OrderUpdateInput {
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    orderId: typeof obj.orderId === "string" || typeof obj.orderId === "number" ? BigInt(obj.orderId) : (typeof obj.id === "string" || typeof obj.id === "number" ? BigInt(obj.id) : 1n),
    status: typeof obj.status === "string" ? obj.status : "CONFIRMED",
  };
}

export class CreateOrderDto {
  @ApiProperty({ example: 1, description: "Customer ID", type: Number })
  customerId!: number;

  @ApiProperty({ example: 1, description: "Shipping address ID", type: Number })
  addressId!: number;

  @ApiProperty({ example: "ONLINE", description: "Payment mode ('ONLINE', 'COD', 'CARD')" })
  paymentMode!: string;

  @ApiPropertyOptional({ example: "Please deliver during business hours.", description: "Special order instructions" })
  notes?: string;
}

export class UpdateOrderDto {
  @ApiProperty({ example: 1, description: "Order ID to update", type: Number })
  orderId!: number;

  @ApiProperty({ example: "CONFIRMED", description: "New order status ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')" })
  status!: string;
}

export class CreateOrderFulfillmentDto {
  @ApiProperty({ example: 1, description: "Order ID", type: Number })
  orderId!: number;

  @ApiPropertyOptional({ example: "AWB987654321", description: "Tracking number" })
  trackingNumber?: string;

  @ApiPropertyOptional({ example: "BlueDart", description: "Carrier / Logistic Partner name" })
  carrier?: string;

  @ApiPropertyOptional({ example: "https://tracking.carrier.com/AWB987654321", description: "Tracking URL" })
  trackingUrl?: string;

  @ApiProperty({ example: "DISPATCHED", description: "Fulfillment status ('PACKED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED')" })
  status!: string;
}

export class UpdateOrderFulfillmentDto {
  @ApiProperty({ example: 1, description: "Fulfillment ID or Order ID", type: Number })
  fulfillmentId!: number;

  @ApiProperty({ example: "DELIVERED", description: "Updated fulfillment status" })
  status!: string;

  @ApiPropertyOptional({ example: "https://tracking.carrier.com/AWB987654321", description: "Tracking URL" })
  trackingUrl?: string;
}

export class CreateOrderReadyDto {
  @ApiProperty({ example: 1, description: "Order ID", type: Number })
  orderId!: number;

  @ApiProperty({ example: true, description: "Order ready status" })
  ready!: boolean;

  @ApiPropertyOptional({ example: "All fabric rolls inspected and packed", description: "Remarks / packing notes" })
  remarks?: string;
}

export class UpdateOrderReadyDto {
  @ApiProperty({ example: 1, description: "Order ID", type: Number })
  orderId!: number;

  @ApiProperty({ example: true, description: "Order ready status" })
  ready!: boolean;
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

export class SendOrderNotificationEmailDto {
  @ApiProperty({ example: 1, description: "Order ID", type: Number })
  @IsNotEmpty()
  @IsNumber()
  orderId!: number;

  @ApiPropertyOptional({ example: "ORDER_CONFIRMATION", description: "Email notification trigger type ('ORDER_CONFIRMATION', 'ORDER_FULFILLMENT_DISPATCH', 'ORDER_PAYMENT_FAILED', 'ORDER_CANCELLED')" })
  @IsOptional()
  @IsString()
  triggerType?: string;

  @ApiPropertyOptional({ example: "customer@example.com", description: "Optional recipient email override" })
  @IsOptional()
  @IsString()
  recipientEmail?: string;
}
