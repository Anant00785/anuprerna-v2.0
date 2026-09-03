import { BadRequestException, Body, Controller, HttpCode, Patch, Post, UseGuards } from "@nestjs/common";
import { GateCode, type AuthenticatedTenant } from "../../auth/types/auth.types.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { ApiBody, ApiOperation, ApiProperty, ApiResponse, ApiTags } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive, IsString, Length } from "class-validator";
import { Type } from "class-transformer";
import { CurrentTenant } from "../../common/auth/current-tenant.decorator.js";
import { DiscountService } from "./discount.service.js";
import { simpleResponse, type RainSimple } from "../../common/response/rain-response.js";

/**
 * Mirrors Loom's VoucherApplicationRequest + VoucherApplicationRequestValidator:
 * couponCode 3–255 chars, cartValue > 0 — both REQUIRED. A missing cart total
 * is a 400, never a guessed one (this endpoint used to invent `cartTotal || 2500`
 * and approve a hardcoded 15% off without touching the database).
 */
export class ApplyVoucherDiscountDto {
  @ApiProperty({ example: "WELCOME15", description: "Coupon or Voucher Code" })
  @IsNotEmpty()
  @IsString()
  @Length(3, 255)
  voucherCode!: string;

  @ApiProperty({ example: 2500, description: "Cart Subtotal in INR (must be > 0)" })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  cartTotal!: number;
}

/** Loom VoucherApplicationEnhancedResponse.prepareResponse, 1:1. */
const VOUCHER_MESSAGES: Record<number, string> = {
  0: "voucher applied!",
  1: "invalid voucher code!",
  2: "minimum order value not satisfied!",
  3: "voucher is not applicable!",
  4: "voucher is expired!",
  5: "voucher already used!",
};

@ApiTags("Discount")
@Controller()
@UseGuards(RolesGuard)
export class DiscountController {
  constructor(private readonly service: DiscountService) {}

  private async applyVoucher(tenant: AuthenticatedTenant | undefined, body: ApplyVoucherDiscountDto): Promise<RainSimple> {
    if (!tenant?.id) {
      throw new BadRequestException("Authenticated tenant is required to apply a voucher.");
    }
    const code = await this.service.applyVoucher(tenant.id, body.voucherCode, body.cartTotal);
    return simpleResponse(code === 0, VOUCHER_MESSAGES[code] ?? "voucher is not applicable!");
  }

  @Post("apply/voucher/discount")
  @HttpCode(200)
  @ApiOperation({ summary: "Apply voucher coupon code to checkout cart (POST)" })
  @ApiBody({ type: ApplyVoucherDiscountDto })
  @ApiResponse({ status: 200, description: "Voucher application result" })
  @RequireGate(GateCode.CODE_CU)
  async applyVoucherDiscountPost(@CurrentTenant() tenant: AuthenticatedTenant | undefined, @Body() body: ApplyVoucherDiscountDto) {
    return this.applyVoucher(tenant, body);
  }

  @Patch("apply/voucher/discount")
  @HttpCode(200)
  @ApiOperation({ summary: "Apply voucher coupon code to checkout cart (PATCH)" })
  @ApiBody({ type: ApplyVoucherDiscountDto })
  @ApiResponse({ status: 200, description: "Voucher application result" })
  @RequireGate(GateCode.CODE_CU)
  async applyVoucherDiscountPatch(@CurrentTenant() tenant: AuthenticatedTenant | undefined, @Body() body: ApplyVoucherDiscountDto) {
    return this.applyVoucher(tenant, body);
  }
}
