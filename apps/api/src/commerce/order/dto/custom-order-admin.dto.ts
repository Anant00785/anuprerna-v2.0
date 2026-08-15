import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

// ─── Create Custom Order ─────────────────────────────────────────────────────

export class CreateCustomOrderItemDto {
  @ApiProperty({ example: "fabric", description: "Product group ('fabric' | 'finished' | 'custom')" })
  @IsNotEmpty()
  @IsString()
  productGroup!: string;

  @ApiProperty({ example: "MADE_TO_ORDER", description: "Order type ('MADE_TO_ORDER' | 'READY_TO_SHIP')" })
  @IsNotEmpty()
  @IsString()
  orderType!: string;

  @ApiProperty({ example: 10, description: "Quantity" })
  @IsNotEmpty()
  @IsNumber()
  quantity!: number;

  @ApiPropertyOptional({ example: "METER", description: "Unit of measure" })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: 1500.0, description: "Unit price" })
  @IsNotEmpty()
  @IsNumber()
  price!: number;

  @ApiProperty({ example: "INR", description: "Currency code" })
  @IsNotEmpty()
  @IsString()
  currency!: string;

  @ApiPropertyOptional({
    example: { fabricProductId: 655838, finishedProductId: 0, customProductId: 0 },
    description: "Customization object containing product IDs"
  })
  @IsOptional()
  customization?: Record<string, any>;

  @ApiPropertyOptional({ example: "Hand-dyed indigo cotton", description: "Item description" })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateCustomOrderDto {
  @ApiPropertyOptional({
    example: { name: "Anant Kumar", line1: "12 MG Road", city: "Jaipur", state: "Rajasthan", pincode: "302001", country: "India", phone: "9876543210" },
    description: "Delivery address object"
  })
  @IsOptional()
  address?: Record<string, any>;

  @ApiPropertyOptional({ example: "INR", description: "Currency code" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: "FABRIC", description: "Order type" })
  @IsOptional()
  @IsString()
  orderType?: string;

  @ApiPropertyOptional({ example: "Please use eco-friendly packaging", description: "Customer note" })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: ["billing@anuprerna.com"], description: "CC email addresses" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ccEmails?: string[];

  @ApiPropertyOptional({ example: false, description: "Whether this is a loyalty order" })
  @IsOptional()
  @IsBoolean()
  loyaltyOrder?: boolean;

  @ApiPropertyOptional({ example: { provider: "DELHIVERY", code: "STD" }, description: "Shipping mode object" })
  @IsOptional()
  shippingMode?: Record<string, any>;

  @ApiPropertyOptional({ type: [CreateCustomOrderItemDto], description: "Line items to include in the order" })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCustomOrderItemDto)
  orderItemList?: CreateCustomOrderItemDto[];
}

export class UpdateCustomOrderDto {
  @ApiProperty({ example: 1, description: "Custom Order ID" })
  @IsNotEmpty()
  @IsNumber()
  orderId!: number;

  @ApiPropertyOptional({ example: ["billing@anuprerna.com"], description: "CC email addresses" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ccEmails?: string[];

  @ApiPropertyOptional({ example: 1690000000000, description: "Estimated delivery from timestamp (ms)" })
  @IsOptional()
  @IsNumber()
  estimatedDeliveryFrom?: number;

  @ApiPropertyOptional({ example: 1691000000000, description: "Estimated delivery to timestamp (ms)" })
  @IsOptional()
  @IsNumber()
  estimatedDeliveryTo?: number;

  @ApiPropertyOptional({ example: "INR", description: "Currency code" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: "FABRIC", description: "Order type" })
  @IsOptional()
  @IsString()
  orderType?: string;

  @ApiPropertyOptional({ example: false, description: "Whether this is a loyalty order" })
  @IsOptional()
  @IsBoolean()
  loyaltyOrder?: boolean;
}

export class CancelCustomOrderDto {
  @ApiProperty({ example: 1, description: "Custom Order ID to cancel" })
  @IsNotEmpty()
  @IsNumber()
  orderId!: number;

  @ApiPropertyOptional({ example: "Customer requested cancellation before dispatch", description: "Reason for cancellation" })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}


export class UpdateCustomOrderGlobalNoteDto {
  @ApiProperty({ example: 1, description: "Custom Order ID" })
  @IsNotEmpty()
  @IsNumber()
  orderId!: number;

  @ApiProperty({ example: "Internal note: Priority processing requested for corporate client", description: "Internal staff note text" })
  @IsNotEmpty()
  @IsString()
  globalNote!: string;
}

export class UpdateCustomOrderItemDto {
  @ApiProperty({ example: 1, description: "Custom Order Item ID" })
  @IsNotEmpty()
  @IsNumber()
  orderItemId!: number;

  @ApiProperty({ example: 10, description: "Updated quantity" })
  @IsNotEmpty()
  @IsNumber()
  quantity!: number;

  @ApiProperty({ example: 1500.00, description: "Updated line item price" })
  @IsNotEmpty()
  @IsNumber()
  price!: number;
}

export class CustomOrderItemInputDto {
  @ApiPropertyOptional({ example: 1, description: "Item ID if updating existing" })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({ example: "fabric", description: "Product group ('fabric' | 'finished')" })
  @IsNotEmpty()
  @IsString()
  productGroup!: string;

  @ApiProperty({ example: "MADE_TO_ORDER", description: "Order type" })
  @IsNotEmpty()
  @IsString()
  orderType!: string;

  @ApiProperty({ example: 10, description: "Quantity" })
  @IsNotEmpty()
  @IsNumber()
  quantity!: number;

  @ApiPropertyOptional({ example: "METER", description: "Unit of measure" })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: 1500.00, description: "Unit price" })
  @IsNotEmpty()
  @IsNumber()
  price!: number;

  @ApiProperty({ example: "INR", description: "Currency code" })
  @IsNotEmpty()
  @IsString()
  currency!: string;

  @ApiPropertyOptional({ example: {}, description: "Customization details object" })
  @IsOptional()
  customization?: Record<string, any>;

  @ApiPropertyOptional({ example: "Handwoven Organic Cotton Fabric", description: "Item description" })
  @IsOptional()
  @IsString()
  description?: string;
}

export class AddCustomOrderItemsDto {
  @ApiProperty({ example: 1, description: "Custom Order ID" })
  @IsNotEmpty()
  @IsNumber()
  orderId!: number;

  @ApiProperty({ type: [CustomOrderItemInputDto], description: "List of line items to add" })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomOrderItemInputDto)
  customOrderItemList!: CustomOrderItemInputDto[];
}

export class UpdateCustomOrderShipmentDto {
  @ApiProperty({ example: 1, description: "Custom Order ID" })
  @IsNotEmpty()
  @IsNumber()
  orderId!: number;

  @ApiPropertyOptional({ example: 1, description: "Shipment Provider ID" })
  @IsOptional()
  @IsNumber()
  shipmentId?: number;

  @ApiPropertyOptional({ example: "AWB987654321", description: "Shipping tracking code" })
  @IsOptional()
  @IsString()
  shippingCode?: string;

  @ApiPropertyOptional({ example: "https://track.delhivery.com/AWB987654321", description: "Tracking URL" })
  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @ApiPropertyOptional({ example: "PKG-12345", description: "Zoho Package ID" })
  @IsOptional()
  @IsString()
  zohoPackageId?: string;
}

export class UpdateCustomOrderInfoDto {
  @ApiProperty({ example: 1, description: "Custom Order ID" })
  @IsNotEmpty()
  @IsNumber()
  orderId!: number;

  @ApiPropertyOptional({ example: ["orders@anuprerna.com", "billing@anuprerna.com"], description: "CC email addresses" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ccEmails?: string[];

  @ApiPropertyOptional({ example: 1690000000000, description: "Estimated delivery from timestamp (ms)" })
  @IsOptional()
  @IsNumber()
  estimatedDeliveryFrom?: number;

  @ApiPropertyOptional({ example: 1691000000000, description: "Estimated delivery to timestamp (ms)" })
  @IsOptional()
  @IsNumber()
  estimatedDeliveryTo?: number;

  @ApiPropertyOptional({ example: "INR", description: "Currency code" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: "FABRIC", description: "Order Type" })
  @IsOptional()
  @IsString()
  orderType?: string;

  @ApiPropertyOptional({ example: false, description: "Whether this is a loyalty order" })
  @IsOptional()
  @IsBoolean()
  loyaltyOrder?: boolean;
}

export class CustomOrderItemFulfillmentInputDto {
  @ApiProperty({ example: 1, description: "Custom Order Item ID" })
  @IsNotEmpty()
  @IsNumber()
  customOrderItemId!: number;

  @ApiProperty({ example: 5, description: "Quantity fulfilled in this batch" })
  @IsNotEmpty()
  @IsNumber()
  quantity!: number;
}

export class AddCustomOrderFulfillmentDto {
  @ApiProperty({ example: 1, description: "Custom Order ID" })
  @IsNotEmpty()
  @IsNumber()
  customOrderId!: number;

  @ApiPropertyOptional({ example: 1, description: "Shipment ID" })
  @IsOptional()
  @IsNumber()
  shipmentId?: number;

  @ApiPropertyOptional({ example: "AWB123456", description: "Shipping tracking code" })
  @IsOptional()
  @IsString()
  shippingCode?: string;

  @ApiPropertyOptional({ example: "https://track.shipment.com/AWB123456", description: "Tracking URL" })
  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @ApiPropertyOptional({ example: "First partial shipment dispatched", description: "Fulfillment note" })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ type: [CustomOrderItemFulfillmentInputDto], description: "List of items and quantities fulfilled" })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomOrderItemFulfillmentInputDto)
  customOrderItemFulfillmentList?: CustomOrderItemFulfillmentInputDto[];
}

export class UpdateCustomOrderFulfillmentDto {
  @ApiProperty({ example: 1, description: "Custom Order Fulfillment ID" })
  @IsNotEmpty()
  @IsNumber()
  customOrderFulfillmentId!: number;

  @ApiPropertyOptional({ example: "AWB123456-UPDATED", description: "Updated tracking code" })
  @IsOptional()
  @IsString()
  shippingCode?: string;

  @ApiPropertyOptional({ example: "https://track.shipment.com/AWB123456-UPDATED", description: "Updated tracking URL" })
  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @ApiPropertyOptional({ example: "Updated fulfillment note", description: "Fulfillment note" })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CustomOrderItemReadyInputDto {
  @ApiProperty({ example: 1, description: "Custom Order Item ID" })
  @IsNotEmpty()
  @IsNumber()
  customOrderItemId!: number;

  @ApiProperty({ example: 5, description: "Quantity ready" })
  @IsNotEmpty()
  @IsNumber()
  quantity!: number;
}

export class AddCustomOrderReadyDto {
  @ApiProperty({ example: 1, description: "Custom Order ID" })
  @IsNotEmpty()
  @IsNumber()
  customOrderId!: number;

  @ApiPropertyOptional({ example: 1690000000000, description: "Received date timestamp (ms)" })
  @IsOptional()
  @IsNumber()
  receivedDate?: number;

  @ApiPropertyOptional({ example: "Item completed weaving inspection", description: "Ready status note" })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ type: [CustomOrderItemReadyInputDto], description: "List of items ready" })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomOrderItemReadyInputDto)
  customOrderItemReadyList?: CustomOrderItemReadyInputDto[];
}

export class UpdateCustomOrderReadyDto {
  @ApiProperty({ example: 1, description: "Custom Order Ready ID" })
  @IsNotEmpty()
  @IsNumber()
  customOrderReadyId!: number;

  @ApiPropertyOptional({ example: 1690000000000, description: "Received date timestamp (ms)" })
  @IsOptional()
  @IsNumber()
  receivedDate?: number;

  @ApiPropertyOptional({ example: "Updated ready note", description: "Ready status note" })
  @IsOptional()
  @IsString()
  note?: string;
}

export class AddCustomOrderAdjustmentDto {
  @ApiProperty({ example: 1, description: "Custom Order ID" })
  @IsNotEmpty()
  @IsNumber()
  customOrderId!: number;

  @ApiProperty({ example: "Special bulk discount applied", description: "Reason for adjustment" })
  @IsNotEmpty()
  @IsString()
  reason!: string;

  @ApiProperty({ example: -500.00, description: "Adjustment amount (+ or -)" })
  @IsNotEmpty()
  @IsNumber()
  amount!: number;
}

export class UpdateCustomOrderAdjustmentDto {
  @ApiProperty({ example: 1, description: "Adjustment ID" })
  @IsNotEmpty()
  @IsNumber()
  adjustmentId!: number;

  @ApiPropertyOptional({ example: "Updated reason for adjustment", description: "Reason for adjustment" })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: -600.00, description: "Updated adjustment amount" })
  @IsOptional()
  @IsNumber()
  amount?: number;
}
