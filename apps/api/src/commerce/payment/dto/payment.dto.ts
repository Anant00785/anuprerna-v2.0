// @ts-nocheck
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class CreateRazorpayPaymentSessionDto {
  @ApiProperty({ example: 2440968, description: "Loom Order ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  orderId!: number;

  @ApiProperty({ example: "advance", description: "Payment Type: 'advance' or 'remaining'" })
  @IsNotEmpty()
  @IsString()
  paymentType!: string;
}

export class CreateStripePaymentSessionDto {
  @ApiProperty({ example: 2440968, description: "Loom Order ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  loomOrderId!: number;

  @ApiProperty({ example: "advance", description: "Payment Type: 'advance' or 'remaining'" })
  @IsNotEmpty()
  @IsString()
  paymentType!: string;

  @ApiProperty({ example: "USD", description: "Currency Code" })
  @IsNotEmpty()
  @IsString()
  currency!: string;

  @ApiProperty({ example: 15000, description: "Total amount in smallest currency unit (e.g. cents)" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  totalAmount!: number;

  @ApiPropertyOptional({ example: "customer@example.com", description: "Customer Email" })
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiPropertyOptional({ example: "John Doe", description: "Customer Name" })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: "+1234567890", description: "Customer Phone" })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({ example: "US", description: "Customer Country Code" })
  @IsOptional()
  @IsString()
  customerCountryCode?: string;

  @ApiPropertyOptional({ example: "US", description: "Customer Shipping Country Code" })
  @IsOptional()
  @IsString()
  customerShippingCountryCode?: string;
}

export class UpdatePaymentSuccessDto {
  @ApiProperty({ example: 2440968, description: "Loom Order ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  loomOrderId!: number;

  @ApiProperty({ example: "advance", description: "Payment Type: 'advance' or 'remaining'" })
  @IsNotEmpty()
  @IsString()
  paymentType!: string;

  @ApiProperty({ example: "order_mock_123456", description: "Razorpay Order ID" })
  @IsNotEmpty()
  @IsString()
  razorpayOrderId!: string;

  @ApiProperty({ example: "pay_mock_987654", description: "Payment Transaction ID" })
  @IsNotEmpty()
  @IsString()
  transactionId!: string;

  @ApiPropertyOptional({ example: "mock_signature_abc123", description: "Transaction Signature" })
  @IsOptional()
  @IsString()
  transactionSignature?: string;
}

export class UpdatePaymentFailureDto {
  @ApiProperty({ example: 2440968, description: "Loom Order ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  loomOrderId!: number;

  @ApiProperty({ example: "order_mock_123456", description: "Razorpay Order ID" })
  @IsNotEmpty()
  @IsString()
  razorpayOrderId!: string;

  @ApiPropertyOptional({
    example: { code: "BAD_REQUEST_ERROR", description: "Payment was cancelled by user" },
    description: "Failure Error details",
  })
  @IsOptional()
  error?: any;
}

export class UpdatePaymentTransactionDto {
  @ApiProperty({ example: 2440968, description: "Loom Order ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  loomOrderId!: number;

  @ApiProperty({ example: "advance", description: "Payment Type" })
  @IsNotEmpty()
  @IsString()
  paymentType!: string;

  @ApiProperty({ example: "pay_mock_987654", description: "Payment Transaction ID" })
  @IsNotEmpty()
  @IsString()
  transactionId!: string;
}

export interface RazorpayPaymentInput {
  orderId: bigint;
  paymentType: string;
}

export function parseRazorpayPaymentInput(raw: unknown): RazorpayPaymentInput {
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    orderId: obj.orderId ? BigInt(obj.orderId) : 0n,
    paymentType: typeof obj.paymentType === "string" ? obj.paymentType : "",
  };
}

export interface RazorpayPaymentSuccessInput {
  loomOrderId: bigint;
  paymentType: string;
  razorpayOrderId: string;
  transactionId: string;
  transactionSignature: string;
}

export function parseRazorpayPaymentSuccessInput(raw: unknown): RazorpayPaymentSuccessInput {
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    loomOrderId: obj.loomOrderId ? BigInt(obj.loomOrderId) : 0n,
    paymentType: typeof obj.paymentType === "string" ? obj.paymentType : "advance",
    razorpayOrderId: typeof obj.razorpayOrderId === "string" ? obj.razorpayOrderId : "",
    transactionId: typeof obj.transactionId === "string" ? obj.transactionId : "",
    transactionSignature: typeof obj.transactionSignature === "string" ? obj.transactionSignature : "",
  };
}

export interface RazorpayPaymentFailureInput {
  loomOrderId: bigint;
  razorpayOrderId: string;
  error: any;
}

export function parseRazorpayPaymentFailureInput(raw: unknown): RazorpayPaymentFailureInput {
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    loomOrderId: obj.loomOrderId ? BigInt(obj.loomOrderId) : 0n,
    razorpayOrderId: typeof obj.razorpayOrderId === "string" ? obj.razorpayOrderId : "",
    error: obj.error ?? {},
  };
}

export interface RazorpayPaymentUpdateInput {
  loomOrderId: bigint;
  paymentType: string;
  transactionId: string;
}

export function parseRazorpayPaymentUpdateInput(raw: unknown): RazorpayPaymentUpdateInput {
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    loomOrderId: obj.loomOrderId ? BigInt(obj.loomOrderId) : 0n,
    paymentType: typeof obj.paymentType === "string" ? obj.paymentType : "advance",
    transactionId: typeof obj.transactionId === "string" ? obj.transactionId : "",
  };
}

export interface StripePaymentOrderInput {
  loomOrderId: bigint;
  paymentType: string;
  currency: string;
  totalAmount: bigint;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  customerCountryCode: string;
  customerShippingCountryCode: string;
}

export function parseStripePaymentOrderInput(raw: unknown): StripePaymentOrderInput {
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    loomOrderId: obj.loomOrderId ? BigInt(obj.loomOrderId) : 0n,
    paymentType: typeof obj.paymentType === "string" ? obj.paymentType : "advance",
    currency: typeof obj.currency === "string" ? obj.currency : "USD",
    totalAmount: obj.totalAmount ? BigInt(obj.totalAmount) : 0n,
    customerEmail: typeof obj.customerEmail === "string" ? obj.customerEmail : "",
    customerName: typeof obj.customerName === "string" ? obj.customerName : "",
    customerPhone: typeof obj.customerPhone === "string" ? obj.customerPhone : "",
    customerCountryCode: typeof obj.customerCountryCode === "string" ? obj.customerCountryCode : "",
    customerShippingCountryCode: typeof obj.customerShippingCountryCode === "string" ? obj.customerShippingCountryCode : "",
  };
}
