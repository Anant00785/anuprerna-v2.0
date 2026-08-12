import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { AdsConversionService } from "./ads_conversion.service.js";

@ApiTags("ads_conversion")
@Controller()
export class AdsConversionController {
  constructor(private readonly service: AdsConversionService) {}

  @Get("get/ads_conversion")
  @ApiOperation({ summary: "Get all ads_conversion records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/ads_conversion")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a ads_conversion record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

