import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Msg91Service } from "./msg91.service.js";

@ApiTags("msg91")
@Controller({ path: ["msg91", ""] })
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
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

