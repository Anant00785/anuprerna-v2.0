import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { Msg91Service } from "./msg91.service.js";

@ApiTags("msg91")
@Controller()
export class Msg91Controller {
  constructor(private readonly service: Msg91Service) {}

  @Get("get/msg91")
  @ApiOperation({ summary: "Get all msg91 records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/msg91")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a msg91 record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

