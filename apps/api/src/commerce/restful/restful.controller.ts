import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { RestfulService } from "./restful.service.js";

@ApiTags("restful")
@Controller({ path: ["restful", ""] })
export class RestfulController {
  constructor(private readonly service: RestfulService) {}

  @Get("get/restful")
  @ApiOperation({ summary: "Get all restful records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/restful")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a restful record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

