import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { BloomsightService } from "./bloomsight.service.js";

@ApiTags("bloomsight")
@Controller()
export class BloomsightController {
  constructor(private readonly service: BloomsightService) {}

  @Get("get/bloomsight")
  @ApiOperation({ summary: "Get all bloomsight records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/bloomsight")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a bloomsight record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

