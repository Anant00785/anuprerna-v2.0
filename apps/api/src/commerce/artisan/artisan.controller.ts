import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { ArtisanService } from "./artisan.service.js";

@ApiTags("Artisan")
@Controller()
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
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

