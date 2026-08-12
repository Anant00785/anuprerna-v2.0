import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ConfigurationService } from "./configuration.service.js";

@ApiTags("configuration")
@Controller({ path: ["configuration", ""] })
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
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

