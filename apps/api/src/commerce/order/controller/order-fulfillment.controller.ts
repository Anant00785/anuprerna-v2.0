// @ts-nocheck
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
/**
 * migrated/order/controller/order-fulfillment.controller.ts
 */
import { Controller, Get, Post, Patch, Param, Body, UseGuards } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";

@ApiBearerAuth()
@ApiTags("Order")
@Controller()
@UseGuards(RolesGuard)
export class OrderFulfillmentController {

  @Post("/add/order/fulfillment")
  @RequireGate(GateCode.CODE_SU)
  async addFulfillment(@Body() body: any) {
    return simpleResponse(true, "Order fulfillment added");
  }

  @Patch("/update/order/fulfillment")
  @RequireGate(GateCode.CODE_SU)
  async updateFulfillment(@Body() body: any) {
    return simpleResponse(true, "Order fulfillment updated");
  }

  @Get("/get/super-user/order/:orderId/fulfillment-list")
  @RequireGate(GateCode.CODE_SU)
  async getSuperUserFulfillmentList(@Param("orderId") orderId: string) {
    return keyedResponse("fulfillmentList", []);
  }

  @Get("/get/customer/order/:orderId/fulfillment-list")
  @RequireGate(GateCode.CODE_CU)
  async getCustomerFulfillmentList(@Param("orderId") orderId: string) {
    return keyedResponse("fulfillmentList", []);
  }

  @Post("/add/order/ready")
  @RequireGate(GateCode.CODE_SU)
  async addOrderReady(@Body() body: any) {
    return simpleResponse(true, "Order ready status added");
  }

  @Patch("/update/order/ready")
  @RequireGate(GateCode.CODE_SU)
  async updateOrderReady(@Body() body: any) {
    return simpleResponse(true, "Order ready status updated");
  }

  @Get("/get/super-user/order/:orderId/ready-list")
  @RequireGate(GateCode.CODE_SU)
  async getSuperUserReadyList(@Param("orderId") orderId: string) {
    return keyedResponse("readyList", []);
  }
}
