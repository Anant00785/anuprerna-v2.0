import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { ColorService } from "./color.service.js";

@ApiTags("color")
@Controller()
export class ColorController {
  constructor(private readonly service: ColorService) {}

  @Get("get/color")
  @ApiOperation({ summary: "Get all color records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/color")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a color record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

