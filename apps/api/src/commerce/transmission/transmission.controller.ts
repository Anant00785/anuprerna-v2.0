import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { TransmissionService } from "./transmission.service.js";

@ApiTags("transmission")
@Controller()
export class TransmissionController {
  constructor(private readonly service: TransmissionService) {}

  @Get("get/transmission")
  @ApiOperation({ summary: "Get all transmission records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/transmission")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a transmission record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

