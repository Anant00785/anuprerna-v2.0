import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { NVerseService } from "./nverse.service.js";

@ApiTags("nverse")
@Controller({ path: ["nverse", ""] })
export class NVerseController {
  constructor(private readonly service: NVerseService) {}

  @Get("get/nverse")
  @ApiOperation({ summary: "Get all nverse records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/nverse")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a nverse record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

