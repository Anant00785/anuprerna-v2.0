import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { BehemothService } from "./behemoth.service.js";

@ApiTags("Misc")
@Controller()
export class BehemothController {
  constructor(private readonly service: BehemothService) {}

  @Get("get/behemoth")
  @ApiOperation({ summary: "Get all behemoth records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/behemoth")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a behemoth record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

