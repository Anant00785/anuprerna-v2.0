import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ShipmentService } from "./shipment.service.js";

@ApiTags("shipment")
@Controller({ path: ["shipment", ""] })
export class ShipmentController {
  constructor(private readonly service: ShipmentService) {}

  @Get("get/shipment")
  @ApiOperation({ summary: "Get all shipment records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/shipment")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a shipment record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

