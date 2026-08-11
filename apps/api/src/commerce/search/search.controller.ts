import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SearchService } from "./search.service.js";

@ApiTags("search")
@Controller({ path: ["search", ""] })
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
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

