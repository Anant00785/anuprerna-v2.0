import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { SupportService } from "./support.service.js";

@ApiTags("Support")
@Controller()
export class SupportController {
  constructor(private readonly service: SupportService) {}

  @Get("get/support")
  @ApiOperation({ summary: "Get all support records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/support")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a support record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

