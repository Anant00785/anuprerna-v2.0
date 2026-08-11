import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PatternService } from "./pattern.service.js";

@ApiTags("pattern")
@Controller({ path: ["pattern", ""] })
export class PatternController {
  constructor(private readonly service: PatternService) {}

  @Get("get/pattern")
  @ApiOperation({ summary: "Get all pattern records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/pattern")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a pattern record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

