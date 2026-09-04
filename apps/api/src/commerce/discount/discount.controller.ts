import { BadRequestException, Body, Controller, HttpCode, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { GateCode, type AuthenticatedTenant } from "../../auth/types/auth.types.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { ApiBody, ApiOperation, ApiParam, ApiProperty, ApiPropertyOptional, ApiResponse, ApiTags } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Length } from "class-validator";
import { Type } from "class-transformer";
import { CurrentTenant } from "../../common/auth/current-tenant.decorator.js";
import { DiscountService } from "./discount.service.js";
import { keyedResponse, simpleResponse, type RainSimple } from "../../common/response/rain-response.js";

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

/**
 * Body for POST /apply/coupon/{code}. Entirely optional — the storefront sends
 * none — and documented only so a caller that CAN supply the cart total knows
 * the key. See parseOptionalCartTotal for why absence is not zero.
 */
export class ApplyCouponDto {
  @ApiPropertyOptional({ example: 2500, description: "Cart subtotal in INR; omit if unknown" })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  cartTotal?: number;
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

  /**
   * POST /apply/coupon/{code} — NOT a Loom route. The storefront invented it
   * (apps/storefront/src/lib/api/repositories/checkout.repository.ts
   * `applyCoupon`), which sends the code in the path and NO body, and reads
   * `success`, `message`, and `payload.discountPercentage`.
   *
   * It runs the SAME evaluation as /apply/voucher/discount — there is one
   * pricing path, not two. The only difference is where the cart value comes
   * from, and that is the whole difficulty: the caller sends none.
   *
   *   - `cartTotal` is accepted in an OPTIONAL body, so a caller that can
   *     supply it gets the full check.
   *   - With no cart total the cart value is 0, which satisfies a coupon whose
   *     `minimum_order_value` is 0 and fails every other one. That failure is
   *     reported as "cart total not supplied", not as "minimum not met" — the
   *     server genuinely does not know the cart, and saying otherwise would be
   *     a verdict it did not reach.
   *
   * It is deliberately NOT derived server-side from the cart: cart_item stores
   * no price, so a cart subtotal would mean re-deriving catalogue prices,
   * volume tiers, making charges and units — a second pricing path beside
   * CheckoutService, which is what produces divergent money.
   *
   * On approval the payload carries the REAL row: no fallback percentage, and
   * no payload at all on a rejection.
   */
  @Post("apply/coupon/:code")
  @HttpCode(200)
  @ApiOperation({ summary: "Apply a coupon code passed in the path (storefront checkout)" })
  @ApiParam({ name: "code", example: "REAL10", description: "Coupon code, 3–255 characters" })
  @ApiBody({ type: ApplyCouponDto, required: false })
  @ApiResponse({ status: 200, description: "Coupon application result" })
  @RequireGate(GateCode.CODE_CU)
  async applyCoupon(
    @CurrentTenant() tenant: AuthenticatedTenant | undefined,
    @Param("code") code: string,
    @Body() body: unknown,
  ) {
    if (!tenant?.id) {
      throw new BadRequestException("Authenticated tenant is required to apply a coupon.");
    }

    const couponCode = (code ?? "").trim();
    if (couponCode.length < 3 || couponCode.length > 255) {
      throw new BadRequestException("A coupon code must be between 3 and 255 characters.");
    }

    const cartTotal = parseOptionalCartTotal(body);
    const { code: outcome, discount } = await this.service.evaluateVoucher(tenant.id, couponCode, cartTotal ?? 0);

    if (outcome !== 0) {
      const message =
        outcome === 2 && cartTotal === null
          ? "cart total not supplied, so this coupon's minimum order value could not be checked!"
          : (VOUCHER_MESSAGES[outcome] ?? "voucher is not applicable!");
      return simpleResponse(false, message);
    }

    // Unreachable — code 0 only comes back with the row that produced it — but
    // an approval without a row would be an invented discount, so it is refused
    // rather than defaulted.
    if (!discount) {
      throw new BadRequestException("The coupon could not be priced.");
    }

    return keyedResponse("payload", {
      couponCode: discount.couponCode,
      discountType: discount.discountType,
      discountMethod: discount.discountMethod,
      discountPercentage: discount.discountPercentage,
      minimumOrderValue: discount.minimumOrderValue,
    }, true, VOUCHER_MESSAGES[0]);
  }
}

/**
 * The storefront sends no body at all. A body IS accepted when present, so a
 * caller able to supply the cart total gets the minimum-order-value check —
 * but a malformed or non-positive figure is `null` (unknown), never 0
 * (a known-empty cart), because those two lead to different verdicts.
 */
function parseOptionalCartTotal(body: unknown): number | null {
  if (body === null || body === undefined || typeof body !== "object") return null;
  const raw = (body as Record<string, unknown>).cartTotal ?? (body as Record<string, unknown>).cartValue;
  if (raw === null || raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}
