import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { AlfredService } from "./alfred.service.js";

@ApiTags("alfred")
@Controller()
export class AlfredController {
  constructor(private readonly service: AlfredService) {}

  @Get("get/alfred")
  @ApiOperation({ summary: "Get all alfred records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/alfred")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a alfred record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

