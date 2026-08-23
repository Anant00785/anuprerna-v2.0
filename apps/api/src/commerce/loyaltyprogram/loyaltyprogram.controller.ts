import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { LoyaltyprogramService } from "./loyaltyprogram.service.js";

@ApiTags("Loyalty Program")
@Controller()
export class LoyaltyprogramController {
  constructor(private readonly service: LoyaltyprogramService) {}

  @Get("get/loyaltyprogram")
  @ApiOperation({ summary: "Get all loyaltyprogram records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/loyaltyprogram")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a loyaltyprogram record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

