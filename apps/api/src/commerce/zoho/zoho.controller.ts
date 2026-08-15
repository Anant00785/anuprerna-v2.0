import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { ZohoService } from "./zoho.service.js";

@ApiTags("ZOHO Integration")
@Controller()
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
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

