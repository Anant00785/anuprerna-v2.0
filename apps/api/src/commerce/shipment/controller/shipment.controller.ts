// @ts-nocheck
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { ShipmentService } from "../service/shipment.service.js";
import { CreateShipmentDto, UpdateShipmentDto, parseShipmentInput } from "../dto/shipment.dto.js";

@ApiBearerAuth()
@ApiTags("Shipment")
@Controller()
@UseGuards(RolesGuard)
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Get("/get/shipment-list")
  @ApiOperation({ summary: "Get list of all active shipment methods." })
  @ApiResponse({ status: 200, description: "List of shipment methods." })
  async getShipmentList() {
    const list = await this.shipmentService.getShipmentList();
    return keyedResponse("shipmentList", list);
  }

  @Get("/get/shipment/:shipmentId")
  @ApiOperation({ summary: "Get shipment method details by ID." })
  @ApiParam({ name: "shipmentId", type: Number, description: "Shipment unique identifier", example: 21209 })
  @ApiResponse({ status: 200, description: "Shipment details." })
  async getShipment(@Param("shipmentId") shipmentId: string) {
    const id = BigInt(shipmentId);
    const shipment = await this.shipmentService.getShipment(id);
    return keyedResponse("shipment", shipment);
  }

  @Post("/add/shipment")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create a new shipment method." })
  @ApiBody({ type: CreateShipmentDto })
  @ApiResponse({ status: 201, description: "Shipment created successfully." })
  async createShipment(@Body() body: CreateShipmentDto) {
    const input = parseShipmentInput(body);
    const result = await this.shipmentService.createShipment(input);
    return simpleResponse(result.success, result.message);
  }

  @Patch("/update/shipment")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update an existing shipment method." })
  @ApiBody({ type: UpdateShipmentDto })
  @ApiResponse({ status: 200, description: "Shipment updated successfully." })
  async updateShipment(@Body() body: UpdateShipmentDto) {
    const input = parseShipmentInput(body);
    const result = await this.shipmentService.updateShipment(input);
    return simpleResponse(result.success, result.message);
  }

  @Delete("/delete/shipment/:shipmentId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete shipment method by ID." })
  @ApiParam({ name: "shipmentId", type: Number, description: "Shipment unique identifier", example: 21209 })
  @ApiResponse({ status: 200, description: "Shipment deletion response." })
  async deleteShipment(@Param("shipmentId") shipmentId: string) {
    const id = BigInt(shipmentId);
    const result = await this.shipmentService.deleteShipment(id);
    return simpleResponse(result.success, result.message);
  }

  @Get("/get/table-explorer/data/shipment")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Get paginated shipments for Table Explorer." })
  @ApiQuery({ name: "page", required: false, type: Number, example: 0, description: "Page number" })
  @ApiQuery({ name: "size", required: false, type: Number, example: 10, description: "Page size" })
  @ApiResponse({ status: 200, description: "Paginated shipment list." })
  async getShipmentData(
    @Query("page") pageStr: string = "0",
    @Query("size") sizeStr: string = "10"
  ) {
    const page = parseInt(pageStr, 10) || 0;
    const size = parseInt(sizeStr, 10) || 10;
    const list = await this.shipmentService.getShipmentData(page, size);
    return keyedResponse("shipmentDataList", list);
  }

  @Get("/get/table-explorer/data/shipment/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Get shipment record by ID for Table Explorer." })
  @ApiParam({ name: "id", type: Number, description: "Shipment unique identifier", example: 21209 })
  @ApiResponse({ status: 200, description: "Shipment details." })
  async getShipmentDataById(@Param("id") idStr: string) {
    const id = BigInt(idStr);
    const shipment = await this.shipmentService.getShipmentDataById(id);
    return keyedResponse("shipmentData", shipment);
  }
}
