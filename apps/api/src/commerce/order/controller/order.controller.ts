// @ts-nocheck
import { ApiBearerAuth } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Req } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { OrderService } from "../service/order.service.js";
import { parseOrderInput, parseOrderUpdateInput } from "../dto/order.dto.js";

@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post("/add/order")
  @RequireGate(GateCode.CODE_CU)
  async addOrder(@Body() body: unknown) {
    const input = parseOrderInput(body);
    const result = await this.orderService.createOrder(input);
    if (result) {
      return simpleResponse(true, "Order created successfully.");
    }
    return simpleResponse(false, "Failed to create order.");
  }

  @Get("/get/customer/order/:orderId")
  @RequireGate(GateCode.CODE_CU)
  async getCustomerOrder(@Param("orderId") orderId: string) {
    const result = await this.orderService.getOrderById(BigInt(orderId));
    return keyedResponse("order", result);
  }

  @Get("/get/customer/order-list")
  @RequireGate(GateCode.CODE_CU)
  async getCustomerOrderList(@CurrentTenant() tenant: AuthenticatedTenant, @Query("page") page: string = "0", @Query("size") size: string = "10") {
    const result = await this.orderService.getCustomerOrders(tenant.tenantId, parseInt(page, 10), parseInt(size, 10));
    return keyedResponse("orderList", result);
  }

  @Get("/get/super-user/order/:orderId")
  @RequireGate(GateCode.CODE_SU)
  async getSuperUserOrder(@Param("orderId") orderId: string) {
    const result = await this.orderService.getOrderById(BigInt(orderId));
    return keyedResponse("order", result);
  }

  @Get("/get/super-user/order-list")
  @RequireGate(GateCode.CODE_SU)
  async getSuperUserOrderList(@Query("page") page: string = "0", @Query("size") size: string = "10") {
    const result = await this.orderService.getAllOrders(parseInt(page, 10), parseInt(size, 10));
    return keyedResponse("orderList", result);
  }

  @Patch("/update/order")
  @RequireGate(GateCode.CODE_SU)
  async updateOrder(@Body() body: unknown) {
    const input = parseOrderUpdateInput(body);
    const result = await this.orderService.updateOrderStatus(input);
    if (result) {
      return simpleResponse(true, "Order updated successfully.");
    }
    return simpleResponse(false, "Failed to update order.");
  }

  @Delete("/delete/order/:orderId")
  @RequireGate(GateCode.CODE_SU)
  async deleteOrder(@Param("orderId") orderId: string) {
    const result = await this.orderService.deleteOrder(BigInt(orderId));
    if (result) {
      return simpleResponse(true, "Order deleted successfully.");
    }
    return simpleResponse(false, "Failed to delete order.");
  }
}
