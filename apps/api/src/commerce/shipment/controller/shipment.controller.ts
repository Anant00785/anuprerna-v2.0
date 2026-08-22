// @ts-nocheck
import { ApiBearerAuth } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Req } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { ShipmentService } from "../service/shipment.service.js";
import { parseShipmentInput } from "../dto/shipment.dto.js";

@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Get("/get/shipment-list")
  async getShipmentList() {
    const list = await this.shipmentService.getShipmentList();
    return keyedResponse("shipmentList", list);
  }

  @Get("/get/shipment/:shipmentId")
  async getShipment(@Param("shipmentId") shipmentId: string) {
    const id = BigInt(shipmentId);
    const shipment = await this.shipmentService.getShipment(id);
    return keyedResponse("shipment", shipment);
  }

  @Post("/add/shipment")
  @RequireGate(GateCode.CODE_SU)
  async createShipment(@Body() body: unknown) {
    const input = parseShipmentInput(body);
    const result = await this.shipmentService.createShipment(input);
    return simpleResponse(result.success, result.message);
  }

  @Patch("/update/shipment")
  @RequireGate(GateCode.CODE_SU)
  async updateShipment(@Body() body: unknown) {
    const input = parseShipmentInput(body);
    const result = await this.shipmentService.updateShipment(input);
    return simpleResponse(result.success, result.message);
  }

  @Delete("/delete/shipment/:shipmentId")
  @RequireGate(GateCode.CODE_SU)
  async deleteShipment(@Param("shipmentId") shipmentId: string) {
    const id = BigInt(shipmentId);
    const result = await this.shipmentService.deleteShipment(id);
    return simpleResponse(result.success, result.message);
  }

  @Get("/get/table-explorer/data/shipment")
  async getShipmentData(
    @Query("page") pageStr: string,
    @Query("size") sizeStr: string
  ) {
    const page = parseInt(pageStr, 10) || 0;
    const size = parseInt(sizeStr, 10) || 10;
    const list = await this.shipmentService.getShipmentData(page, size);
    return keyedResponse("shipmentDataList", list);
  }

  @Get("/get/table-explorer/data/shipment/:id")
  async getShipmentDataById(@Param("id") idStr: string) {
    const id = BigInt(idStr);
    const shipment = await this.shipmentService.getShipmentDataById(id);
    return keyedResponse("shipmentData", shipment);
  }
}
