import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { DiagnosticsService } from "./diagnostics.service.js";

@ApiTags("diagnostics")
@Controller()
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
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

