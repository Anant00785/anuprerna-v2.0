import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { FaqService } from "./faq.service.js";

@ApiTags("faq")
@Controller()
export class FaqController {
  constructor(private readonly service: FaqService) {}

  @Get("get/faq")
  @ApiOperation({ summary: "Get all faq records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/faq")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a faq record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

