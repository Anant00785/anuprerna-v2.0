import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { SeoService } from "./seo.service.js";

@ApiTags("seo")
@Controller()
export class SeoController {
  constructor(private readonly service: SeoService) {}

  @Get("get/seo")
  @ApiOperation({ summary: "Get all seo records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/seo")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a seo record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

