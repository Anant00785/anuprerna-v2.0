import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { SearchService } from "./search.service.js";

@ApiTags("search")
@Controller()
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get("get/search")
  @ApiOperation({ summary: "Get all search records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/search")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a search record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

