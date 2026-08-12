import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ArtisanService } from "./artisan.service.js";

@ApiTags("artisan")
@Controller({ path: ["artisan", ""] })
export class ArtisanController {
  constructor(private readonly service: ArtisanService) {}

  @Get("get/artisan")
  @ApiOperation({ summary: "Get all artisan records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/artisan")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a artisan record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

