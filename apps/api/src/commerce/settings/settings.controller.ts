import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SettingsService } from "./settings.service.js";

@ApiTags("settings")
@Controller({ path: ["settings", ""] })
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
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

