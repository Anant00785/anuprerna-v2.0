import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { TenantService } from "./tenant.service.js";

@ApiTags("tenant")
@Controller()
export class TenantController {
  constructor(private readonly service: TenantService) {}

  @Get("get/tenant")
  @ApiOperation({ summary: "Get all tenant records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/tenant")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a tenant record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

