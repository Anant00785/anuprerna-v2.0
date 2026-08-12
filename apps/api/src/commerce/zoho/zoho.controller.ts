import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ZohoService } from "./zoho.service.js";

@ApiTags("zoho")
@Controller({ path: ["zoho", ""] })
export class ZohoController {
  constructor(private readonly service: ZohoService) {}

  @Get("get/zoho")
  @ApiOperation({ summary: "Get all zoho records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/zoho")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a zoho record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

