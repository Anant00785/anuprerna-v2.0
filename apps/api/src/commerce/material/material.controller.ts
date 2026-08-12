import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { MaterialService } from "./material.service.js";

@ApiTags("material")
@Controller()
export class MaterialController {
  constructor(private readonly service: MaterialService) {}

  @Get("get/material")
  @ApiOperation({ summary: "Get all material records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/material")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a material record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

