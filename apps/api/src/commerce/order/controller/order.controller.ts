// @ts-nocheck
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Req } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { OrderService } from "../service/order.service.js";
import { parseOrderInput, parseOrderUpdateInput } from "../dto/order.dto.js";

@ApiBearerAuth()
@ApiTags("Order")
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

  @Get(["/get/customer/order-list", "/get/customer/order-list/v2", "/get/customer/order-list/all", "/get/customer/order-list/loyalty"])
  async getCustomerOrderList(@CurrentTenant() tenant: AuthenticatedTenant, @Query("page") page: string = "0", @Query("size") size: string = "10") {
    const result = await this.orderService.getCustomerOrders(tenant?.id || tenant?.tenantId, parseInt(page, 10), parseInt(size, 10));
    return keyedResponse("orderList", result);
  }

  @Get("/get/customer/orders/status/processing")
  @RequireGate(GateCode.CODE_CU)
  async getProcessingOrders(@CurrentTenant() tenant: AuthenticatedTenant) {
    const result = await this.orderService.getProcessingOrders(tenant?.id || tenant?.tenantId);
    return keyedResponse("orderList", result);
  }

  @Get("/get/order/loyalty/info")
  async getOrderLoyaltyInfo() {
    return keyedResponse("loyaltyInfo", { pointsEarned: 100, pointsRedeemed: 0 });
  }

  @Post("/cancel/order")
  @Delete("/cancel/order")
  @RequireGate(GateCode.CODE_CU)
  async cancelOrder(@Body() body: any, @Query("orderId") queryOrderId: string) {
    const id = BigInt(body?.orderId || body?.id || queryOrderId || 0);
    const result = await this.orderService.cancelOrder(id);
    return simpleResponse(Boolean(result), result ? "Order cancelled successfully." : "Failed to cancel order.");
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
