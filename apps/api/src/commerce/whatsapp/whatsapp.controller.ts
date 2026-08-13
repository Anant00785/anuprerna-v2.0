import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { WhatsappService } from "./whatsapp.service.js";

@ApiTags("Notifications")
@Controller()
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
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

