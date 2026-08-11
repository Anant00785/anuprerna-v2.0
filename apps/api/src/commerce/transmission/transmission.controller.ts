import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { TransmissionService } from "./transmission.service.js";

@ApiTags("transmission")
@Controller({ path: ["transmission", ""] })
export class TransmissionController {
  constructor(private readonly service: TransmissionService) {}

  @Get("get/transmission")
  @ApiOperation({ summary: "Get all transmission records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/transmission")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a transmission record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

