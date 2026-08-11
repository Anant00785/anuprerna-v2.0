import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { NavigationService } from "./navigation.service.js";

@ApiTags("navigation")
@Controller({ path: ["navigation", ""] })
export class NavigationController {
  constructor(private readonly service: NavigationService) {}

  @Get("get/navigation")
  @ApiOperation({ summary: "Get all navigation records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/navigation")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a navigation record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

