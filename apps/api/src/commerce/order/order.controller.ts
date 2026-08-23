import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { OrderService } from "./order.service.js";

@ApiTags("Order")
@Controller()
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
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

