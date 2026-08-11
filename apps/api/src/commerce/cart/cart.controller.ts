import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CartService } from "./cart.service.js";

@ApiTags("cart")
@Controller({ path: ["cart", ""] })
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
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

