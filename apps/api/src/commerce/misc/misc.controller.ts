import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { MiscService } from "./misc.service.js";

@ApiTags("misc")
@Controller({ path: ["misc", ""] })
export class MiscController {
  constructor(private readonly service: MiscService) {}

  @Get("get/misc")
  @ApiOperation({ summary: "Get all misc records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/misc")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a misc record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

