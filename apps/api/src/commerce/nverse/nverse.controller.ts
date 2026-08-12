import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { NVerseService } from "./nverse.service.js";

@ApiTags("nverse")
@Controller()
export class NVerseController {
  constructor(private readonly service: NVerseService) {}

  @Get("get/nverse")
  @ApiOperation({ summary: "Get all nverse records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/nverse")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a nverse record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

