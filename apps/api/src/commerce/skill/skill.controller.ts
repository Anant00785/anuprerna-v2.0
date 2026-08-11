import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SkillService } from "./skill.service.js";

@ApiTags("skill")
@Controller({ path: ["skill", ""] })
export class SkillController {
  constructor(private readonly service: SkillService) {}

  @Get("get/skill")
  @ApiOperation({ summary: "Get all skill records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/skill")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a skill record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

