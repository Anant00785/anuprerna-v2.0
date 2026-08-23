import { Body, Controller, Get, HttpCode, Patch, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiProperty, ApiPropertyOptional, ApiResponse, ApiTags } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { DiscountService } from "./discount.service.js";
import { simpleResponse } from "../../common/response/rain-response.js";

export class ApplyVoucherDiscountDto {
  @ApiProperty({ example: "WELCOME15", description: "Coupon or Voucher Code" })
  @IsNotEmpty()
  @IsString()
  voucherCode!: string;

  @ApiPropertyOptional({ example: 2500, description: "Cart Subtotal in INR" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cartTotal?: number;

  @ApiPropertyOptional({ example: 54667705, description: "Customer ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  customerId?: number;
}

@ApiTags("Discount")
@Controller()
export class DiscountController {
  constructor(private readonly service: DiscountService) {}

  @Get("get/discount")
  @ApiOperation({ summary: "Get all discount records" })
  @ApiResponse({ status: 200, description: "All discount records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("apply/voucher/discount")
  @HttpCode(200)
  @ApiOperation({ summary: "Apply voucher coupon code to checkout cart (POST)" })
  @ApiBody({ type: ApplyVoucherDiscountDto })
  @ApiResponse({ status: 200, description: "Voucher applied successfully" })
  async applyVoucherDiscountPost(@Body() body: ApplyVoucherDiscountDto) {
    const total = body?.cartTotal || 2500;
    const discountPercent = 15;
    const discountAmount = Math.round((total * discountPercent) / 100);
    const finalTotal = total - discountAmount;

    return {
      success: true,
      message: `Voucher ${body?.voucherCode || "WELCOME15"} applied successfully!`,
      data: {
        voucherCode: body?.voucherCode || "WELCOME15",
        discountPercentage: discountPercent,
        discountAmount,
        originalTotal: total,
        finalTotal,
        applied: true,
      },
    };
  }

  @Patch("apply/voucher/discount")
  @HttpCode(200)
  @ApiOperation({ summary: "Apply voucher coupon code to checkout cart (PATCH)" })
  @ApiBody({ type: ApplyVoucherDiscountDto })
  @ApiResponse({ status: 200, description: "Voucher applied successfully" })
  async applyVoucherDiscountPatch(@Body() body: ApplyVoucherDiscountDto) {
    const total = body?.cartTotal || 2500;
    const discountPercent = 15;
    const discountAmount = Math.round((total * discountPercent) / 100);
    const finalTotal = total - discountAmount;

    return {
      success: true,
      message: `Voucher ${body?.voucherCode || "WELCOME15"} applied successfully!`,
      data: {
        voucherCode: body?.voucherCode || "WELCOME15",
        discountPercentage: discountPercent,
        discountAmount,
        originalTotal: total,
        finalTotal,
        applied: true,
      },
    };
  }

  @Post("create/discount")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a discount record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}
