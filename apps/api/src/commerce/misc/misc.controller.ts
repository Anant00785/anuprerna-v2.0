import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { MiscService } from "./misc.service.js";

@ApiTags("misc")
@Controller()
export class MiscController {
  constructor(private readonly service: MiscService) {}

  @Get("get/misc")
  @ApiOperation({ summary: "Get all misc records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/misc")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a misc record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

