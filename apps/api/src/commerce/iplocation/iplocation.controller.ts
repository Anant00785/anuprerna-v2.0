import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { IPLocationService } from "./iplocation.service.js";

@ApiTags("iplocation")
@Controller({ path: ["iplocation", ""] })
export class IPLocationController {
  constructor(private readonly service: IPLocationService) {}

  @Get("get/iplocation")
  @ApiOperation({ summary: "Get all iplocation records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/iplocation")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a iplocation record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

