import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ProductService } from "./product.service.js";

@ApiTags("product")
@Controller({ path: ["product", ""] })
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
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

