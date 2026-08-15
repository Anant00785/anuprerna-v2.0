import { Body, Controller, Get, HttpCode, Patch, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { DiscountService } from "./discount.service.js";

@ApiTags("Discount")
@Controller()
export class DiscountController {
  constructor(private readonly service: DiscountService) {}

  @Get("get/discount")
  @ApiOperation({ summary: "Get all discount records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("apply/voucher/discount")
  @HttpCode(200)
  @ApiOperation({ summary: "Apply voucher coupon code to checkout cart (POST)" })
  async applyVoucherDiscountPost(@Body() body: any) {
    return this.service.getAll();
  }

  @Patch("apply/voucher/discount")
  @HttpCode(200)
  @ApiOperation({ summary: "Apply voucher coupon code to checkout cart (PATCH)" })
  async applyVoucherDiscountPatch(@Body() body: any) {
    return this.service.getAll();
  }

  @Post("create/discount")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a discount record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}
