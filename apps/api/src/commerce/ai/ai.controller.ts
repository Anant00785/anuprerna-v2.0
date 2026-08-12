import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { AiService } from "./ai.service.js";

@ApiTags("ai")
@Controller()
export class AiController {
  constructor(private readonly service: AiService) {}

  @Get("get/ai")
  @ApiOperation({ summary: "Get all ai records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/ai")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a ai record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

