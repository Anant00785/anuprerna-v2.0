import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { CompatibilityService } from "./compatibility.service.js";

@ApiTags("Compatibility")
@Controller()
export class CompatibilityController {
  constructor(private readonly service: CompatibilityService) {}

  @Get("get/compatibility")
  @ApiOperation({ summary: "Get all compatibility records" })
  async getAll() {
    return this.service.getAll();
  }

  @Get("redirect/product")
  @ApiOperation({ summary: "Legacy URL redirect mapping for products" })
  async redirectProduct() {
    return this.service.getAll();
  }

  @Get("redirect/story")
  @ApiOperation({ summary: "Legacy URL redirect mapping for story content" })
  async redirectStory() {
    return this.service.getAll();
  }

  @Get("redirect/blog")
  @ApiOperation({ summary: "Legacy URL redirect mapping for blog articles" })
  async redirectBlog() {
    return this.service.getAll();
  }

  @Post("create/compatibility")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a compatibility record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}
