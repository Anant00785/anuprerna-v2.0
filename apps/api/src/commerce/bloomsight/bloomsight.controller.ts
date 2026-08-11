import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { BloomsightService } from "./bloomsight.service.js";

@ApiTags("bloomsight")
@Controller({ path: ["bloomsight", ""] })
export class BloomsightController {
  constructor(private readonly service: BloomsightService) {}

  @Get("get/bloomsight")
  @ApiOperation({ summary: "Get all bloomsight records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/bloomsight")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a bloomsight record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

