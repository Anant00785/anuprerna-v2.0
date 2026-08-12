import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SupportService } from "./support.service.js";

@ApiTags("support")
@Controller({ path: ["support", ""] })
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
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

