import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ProfileService } from "./profile.service.js";

@ApiTags("profile")
@Controller({ path: ["profile", ""] })
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @Get("get/profile")
  @ApiOperation({ summary: "Get all profile records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/profile")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a profile record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

