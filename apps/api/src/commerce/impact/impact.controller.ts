import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { ImpactService } from "./impact.service.js";

@ApiTags("Impact")
@Controller()
export class ImpactController {
  constructor(private readonly service: ImpactService) {}

  @Get("get/impact")
  @ApiOperation({ summary: "Get all impact records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/impact")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a impact record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

