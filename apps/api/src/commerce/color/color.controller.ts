import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ColorService } from "./color.service.js";

@ApiTags("color")
@Controller({ path: ["color", ""] })
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
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

