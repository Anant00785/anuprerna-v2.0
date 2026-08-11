import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SitemapService } from "./sitemap.service.js";

@ApiTags("sitemap")
@Controller({ path: ["sitemap", ""] })
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
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

