// @ts-nocheck
import { ApiBearerAuth } from "@nestjs/swagger";
/**
 * migrated/order/controller/custom-order.controller.ts
 */
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { OrderService } from "../service/order.service.js";

@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class CustomOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post("/add/custom-order")
  @RequireGate(GateCode.CODE_CU)
  async createCustomOrder(@CurrentTenant() tenant: AuthenticatedTenant, @Body() body: any) {
    const res = await this.orderService.createCustomOrder(BigInt(tenant.id), body);
    return simpleResponse(Boolean(res), res ? "Custom order created" : "Failed to create custom order");
  }

  @Get("/get/customer/custom-order/:orderId")
  async getCustomerCustomOrder(@CurrentTenant() tenant: AuthenticatedTenant, @Param("orderId") orderId: string) {
    const order = await this.orderService.getCustomOrderById(BigInt(orderId));
    return keyedResponse("customOrder", order);
  }

  @Get("/get/customer/custom-order-list")
  async getCustomerCustomOrderList(@CurrentTenant() tenant: AuthenticatedTenant) {
    const list = await this.orderService.getCustomOrdersByTenant(BigInt(tenant.id));
    return keyedResponse("customOrderList", list);
  }

  @Get("/get/super-user/custom-order/:orderId")
  async getSuperUserCustomOrder(@Param("orderId") orderId: string) {
    const order = await this.orderService.getCustomOrderById(BigInt(orderId));
    return keyedResponse("customOrder", order);
  }

  @Get("/get/super-user/custom-order-list")
  async getSuperUserCustomOrderList() {
    const list = await this.orderService.getAllCustomOrders();
    return keyedResponse("customOrderList", list);
  }

  @Patch("/update/custom-order")
  @RequireGate(GateCode.CODE_SU)
  async updateCustomOrder(@Body() body: any) {
    const res = await this.orderService.updateCustomOrder(body);
    return simpleResponse(res, res ? "Custom order updated" : "Failed to update custom order");
  }

  @Patch("/cancel/custom-order")
  @RequireGate(GateCode.CODE_CU)
  async cancelCustomOrder(@CurrentTenant() tenant: AuthenticatedTenant, @Body() body: any) {
    const orderId = BigInt(body.orderId ?? 0);
    const res = await this.orderService.cancelCustomOrder(orderId, BigInt(tenant.id));
    return simpleResponse(res, res ? "Custom order cancelled" : "Failed to cancel custom order");
  }

  @Delete("/delete/custom-order/:orderId")
  @RequireGate(GateCode.CODE_SU)
  async deleteCustomOrder(@Param("orderId") orderId: string) {
    const res = await this.orderService.deleteCustomOrder(BigInt(orderId));
    return simpleResponse(res, res ? "Custom order deleted" : "Failed to delete custom order");
  }
}
