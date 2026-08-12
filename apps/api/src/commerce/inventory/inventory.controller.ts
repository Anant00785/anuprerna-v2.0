import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InventoryService } from "./inventory.service.js";

@ApiTags("inventory")
@Controller({ path: ["inventory", ""] })
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
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

