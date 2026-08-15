import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { ProfileService } from "./profile.service.js";

@ApiTags("Profiles")
@Controller()
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
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

