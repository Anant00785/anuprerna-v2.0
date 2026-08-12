import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { ConfigurationService } from "./configuration.service.js";

@ApiTags("configuration")
@Controller()
export class ConfigurationController {
  constructor(private readonly service: ConfigurationService) {}

  @Get("get/configuration")
  @ApiOperation({ summary: "Get all configuration records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/configuration")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a configuration record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

