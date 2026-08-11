import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DiscountService } from "./discount.service.js";

@ApiTags("discount")
@Controller({ path: ["discount", ""] })
export class DiscountController {
  constructor(private readonly service: DiscountService) {}

  @Get("get/discount")
  @ApiOperation({ summary: "Get all discount records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/discount")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a discount record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

