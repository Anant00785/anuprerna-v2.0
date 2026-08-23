// @ts-nocheck
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Param, Body, UseGuards } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { CreateOrderFulfillmentDto, UpdateOrderFulfillmentDto, CreateOrderReadyDto, UpdateOrderReadyDto } from "../dto/order.dto.js";

@ApiBearerAuth()
@ApiTags("Order")
@Controller()
@UseGuards(RolesGuard)
export class OrderFulfillmentController {

  @Post("/add/order/fulfillment")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Super User: Add order fulfillment details." })
  @ApiBody({ type: CreateOrderFulfillmentDto })
  @ApiResponse({ status: 201, description: "Order fulfillment added." })
  async addFulfillment(@Body() body: any) {
    return simpleResponse(true, "Order fulfillment added");
  }

  @Patch("/update/order/fulfillment")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Super User: Update order fulfillment status." })
  @ApiBody({ type: UpdateOrderFulfillmentDto })
  @ApiResponse({ status: 200, description: "Order fulfillment updated." })
  async updateFulfillment(@Body() body: any) {
    return simpleResponse(true, "Order fulfillment updated");
  }

  @Get("/get/super-user/order/:orderId/fulfillment-list")
  async getSuperUserFulfillmentList(@Param("orderId") orderId: string) {
    return keyedResponse("fulfillmentList", []);
  }

  @Get("/get/customer/order/:orderId/fulfillment-list")
  async getCustomerFulfillmentList(@Param("orderId") orderId: string) {
    return keyedResponse("fulfillmentList", []);
  }

  @Post("/add/order/ready")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Super User: Mark order items as ready." })
  @ApiBody({ type: CreateOrderReadyDto })
  @ApiResponse({ status: 201, description: "Order ready status added." })
  async addOrderReady(@Body() body: any) {
    return simpleResponse(true, "Order ready status added");
  }

  @Patch("/update/order/ready")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Super User: Update order ready status." })
  @ApiBody({ type: UpdateOrderReadyDto })
  @ApiResponse({ status: 200, description: "Order ready status updated." })
  async updateOrderReady(@Body() body: any) {
    return simpleResponse(true, "Order ready status updated");
  }

  @Get("/get/super-user/order/:orderId/ready-list")
  async getSuperUserReadyList(@Param("orderId") orderId: string) {
    return keyedResponse("readyList", []);
  }
}
