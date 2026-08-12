import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { ReportService } from "./report.service.js";

@ApiTags("report")
@Controller()
export class ReportController {
  constructor(private readonly service: ReportService) {}

  @Get("get/report")
  @ApiOperation({ summary: "Get all report records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/report")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a report record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

