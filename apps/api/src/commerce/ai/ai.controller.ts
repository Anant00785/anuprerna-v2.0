import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AiService } from "./ai.service.js";

@ApiTags("ai")
@Controller({ path: ["ai", ""] })
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
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

