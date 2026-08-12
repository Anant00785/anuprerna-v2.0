import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { ShipmentService } from "./shipment.service.js";

@ApiTags("shipment")
@Controller()
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
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

