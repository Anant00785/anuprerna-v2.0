import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ForexService } from "./forex.service.js";

@ApiTags("forex")
@Controller({ path: ["forex", ""] })
export class ForexController {
  constructor(private readonly service: ForexService) {}

  @Get("get/forex")
  @ApiOperation({ summary: "Get all forex records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/forex")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a forex record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

