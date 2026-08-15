import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { ForexService } from "./forex.service.js";

@ApiTags("Currency & Location")
@Controller()
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
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

