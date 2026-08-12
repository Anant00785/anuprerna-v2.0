import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ZohoAdapterService } from "./zoho_adapter.service.js";

@ApiTags("zoho_adapter")
@Controller({ path: ["zoho_adapter", ""] })
export class ZohoAdapterController {
  constructor(private readonly service: ZohoAdapterService) {}

  @Get("get/zoho_adapter")
  @ApiOperation({ summary: "Get all zoho_adapter records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/zoho_adapter")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a zoho_adapter record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

