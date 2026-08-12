import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { ZohoAdapterService } from "./zoho_adapter.service.js";

@ApiTags("zoho_adapter")
@Controller()
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
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

