import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { FaqService } from "./faq.service.js";

@ApiTags("faq")
@Controller({ path: ["faq", ""] })
export class FaqController {
  constructor(private readonly service: FaqService) {}

  @Get("get/faq")
  @ApiOperation({ summary: "Get all faq records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/faq")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a faq record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

