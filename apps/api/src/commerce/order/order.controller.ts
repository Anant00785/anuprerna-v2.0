import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { OrderService } from "./order.service.js";

@ApiTags("order")
@Controller({ path: ["order", ""] })
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Get("get/order")
  @ApiOperation({ summary: "Get all order records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/order")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a order record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

