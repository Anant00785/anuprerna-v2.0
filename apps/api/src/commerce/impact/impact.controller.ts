import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ImpactService } from "./impact.service.js";

@ApiTags("impact")
@Controller({ path: ["impact", ""] })
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
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

