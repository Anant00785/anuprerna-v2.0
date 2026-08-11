import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { TenantService } from "./tenant.service.js";

@ApiTags("tenant")
@Controller({ path: ["tenant", ""] })
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
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

