import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { CompatibilityService } from "./compatibility.service.js";

@ApiTags("compatibility")
@Controller()
export class CompatibilityController {
  constructor(private readonly service: CompatibilityService) {}

  @Get("get/compatibility")
  @ApiOperation({ summary: "Get all compatibility records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/compatibility")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a compatibility record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

