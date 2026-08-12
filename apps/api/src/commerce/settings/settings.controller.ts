import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { SettingsService } from "./settings.service.js";

@ApiTags("settings")
@Controller()
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get("get/settings")
  @ApiOperation({ summary: "Get all settings records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/settings")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a settings record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

