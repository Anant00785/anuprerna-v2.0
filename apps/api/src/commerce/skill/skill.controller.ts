import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { SkillService } from "./skill.service.js";

@ApiTags("Skill")
@Controller()
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
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

