import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { InventoryService } from "./inventory.service.js";

@ApiTags("Inventory")
@Controller()
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get("get/inventory")
  @ApiOperation({ summary: "Get all inventory records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/inventory")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a inventory record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

