// @ts-nocheck
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Req } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { OrderService } from "../service/order.service.js";
import { CreateOrderDto, UpdateOrderDto, parseOrderInput, parseOrderUpdateInput } from "../dto/order.dto.js";

@ApiBearerAuth()
@ApiTags("Order")
@Controller()
@UseGuards(RolesGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post("/add/order")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Create a new customer order." })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: "Order created successfully." })
  async addOrder(@Body() body: unknown) {
    const input = parseOrderInput(body);
    const result = await this.orderService.createOrder(input);
    if (result) {
      return simpleResponse(true, "Order created successfully.");
    }
    return simpleResponse(false, "Failed to create order.");
  }

  @Get("/get/customer/order/:orderId")
  async getCustomerOrder(@Param("orderId") orderId: string) {
    const result = await this.orderService.getOrderById(BigInt(orderId));
    return keyedResponse("order", result);
  }

  @Get("/get/customer/order-list")
  async getCustomerOrderList(@CurrentTenant() tenant: AuthenticatedTenant, @Query("page") page: string = "0", @Query("size") size: string = "10") {
    const result = await this.orderService.getCustomerOrders(tenant.tenantId, parseInt(page, 10), parseInt(size, 10));
    return keyedResponse("orderList", result);
  }

  @Get("/get/order/loyalty/info")
  @ApiOperation({ summary: "Get order loyalty points info." })
  async getOrderLoyaltyInfo() {
    return keyedResponse("loyaltyInfo", { pointsEarned: 100, pointsRedeemed: 0 });
  }

  @Post("/cancel/order")
  @Delete("/cancel/order")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Cancel an order." })
  @ApiQuery({ name: "orderId", required: false, example: 1, description: "Order ID to cancel", type: Number })
  async cancelOrder(@Body() body: any, @Query("orderId") queryOrderId: string) {
    const id = BigInt(body?.orderId || body?.id || queryOrderId || 0);
    const result = await this.orderService.cancelOrder(id);
    return simpleResponse(Boolean(result), result ? "Order cancelled successfully." : "Failed to cancel order.");
  }

  @Get("/get/super-user/order/:orderId")
  async getSuperUserOrder(@Param("orderId") orderId: string) {
    const result = await this.orderService.getOrderById(BigInt(orderId));
    return keyedResponse("order", result);
  }

  @Get("/get/super-user/order-list")
  async getSuperUserOrderList(@Query("page") page: string = "0", @Query("size") size: string = "10") {
    const result = await this.orderService.getAllOrders(parseInt(page, 10), parseInt(size, 10));
    return keyedResponse("orderList", result);
  }

  @Patch("/update/order")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Super User: Update order status." })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({ status: 200, description: "Order updated successfully." })
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
  @ApiOperation({ summary: "Super User: Delete an order." })
  @ApiParam({ name: "orderId", description: "Order ID to delete", example: 1, type: Number })
  async deleteOrder(@Param("orderId") orderId: string) {
    const result = await this.orderService.deleteOrder(BigInt(orderId));
    if (result) {
      return simpleResponse(true, "Order deleted successfully.");
    }
    return simpleResponse(false, "Failed to delete order.");
  }
}
