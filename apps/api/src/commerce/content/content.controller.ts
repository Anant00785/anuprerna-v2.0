import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { ContentService } from "./content.service.js";

@ApiTags("content")
@Controller()
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
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

