import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { SitemapService } from "./sitemap.service.js";

@ApiTags("sitemap")
@Controller()
export class SitemapController {
  constructor(private readonly service: SitemapService) {}

  @Get("get/sitemap")
  @ApiOperation({ summary: "Get all sitemap records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/sitemap")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a sitemap record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

