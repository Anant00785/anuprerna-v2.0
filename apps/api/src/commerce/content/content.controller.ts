import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ContentService } from "./content.service.js";

@ApiTags("content")
@Controller({ path: ["content", ""] })
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @Get("get/content")
  @ApiOperation({ summary: "Get all content records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/content")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a content record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

