import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { FilterService } from "./filter.service.js";

@ApiTags("filter")
@Controller({ path: ["filter", ""] })
export class FilterController {
  constructor(private readonly service: FilterService) {}

  @Get("get/filter")
  @ApiOperation({ summary: "Get all filter records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/filter")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a filter record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

