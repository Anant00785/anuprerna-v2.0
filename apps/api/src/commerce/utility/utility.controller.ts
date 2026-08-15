import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { UtilityService } from "./utility.service.js";

@ApiTags("Misc")
@Controller()
export class UtilityController {
  constructor(private readonly service: UtilityService) {}

  @Get("get/utility")
  @ApiOperation({ summary: "Get all utility records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/utility")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a utility record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

