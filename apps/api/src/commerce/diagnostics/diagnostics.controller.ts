import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DiagnosticsService } from "./diagnostics.service.js";

@ApiTags("diagnostics")
@Controller({ path: ["diagnostics", ""] })
export class DiagnosticsController {
  constructor(private readonly service: DiagnosticsService) {}

  @Get("get/diagnostics")
  @ApiOperation({ summary: "Get all diagnostics records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/diagnostics")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a diagnostics record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

