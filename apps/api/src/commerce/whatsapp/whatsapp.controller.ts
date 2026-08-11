import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { WhatsappService } from "./whatsapp.service.js";

@ApiTags("whatsapp")
@Controller({ path: ["whatsapp", ""] })
export class WhatsappController {
  constructor(private readonly service: WhatsappService) {}

  @Get("get/whatsapp")
  @ApiOperation({ summary: "Get all whatsapp records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/whatsapp")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a whatsapp record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

