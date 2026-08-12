import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { CartService } from "./cart.service.js";

@ApiTags("cart")
@Controller()
export class CartController {
  constructor(private readonly service: CartService) {}

  @Get("get/cart")
  @ApiOperation({ summary: "Get all cart records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/cart")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a cart record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

