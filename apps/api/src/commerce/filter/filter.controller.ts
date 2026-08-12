import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { FilterService } from "./filter.service.js";

@ApiTags("filter")
@Controller()
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
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

