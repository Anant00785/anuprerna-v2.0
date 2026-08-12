import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { ProductService } from "./product.service.js";

@ApiTags("product")
@Controller()
export class ProductController {
  constructor(private readonly service: ProductService) {}

  @Get("get/product")
  @ApiOperation({ summary: "Get all product records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/product")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a product record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

