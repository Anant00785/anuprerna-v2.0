import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { ArtisanpaymentService } from "./artisanpayment.service.js";

@ApiTags("artisanpayment")
@Controller()
export class ArtisanpaymentController {
  constructor(private readonly service: ArtisanpaymentService) {}

  @Get("get/artisanpayment")
  @ApiOperation({ summary: "Get all artisanpayment records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/artisanpayment")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a artisanpayment record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

