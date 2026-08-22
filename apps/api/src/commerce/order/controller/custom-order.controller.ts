// @ts-nocheck
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { OrderService } from "../service/order.service.js";
import {
  CreateCustomOrderDto,
  UpdateCustomOrderDto,
  CancelCustomOrderDto
} from "../dto/custom-order-admin.dto.js";

@ApiBearerAuth()
@ApiTags("Custom Order")
@Controller()
@UseGuards(RolesGuard)
export class CustomOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post("/add/custom-order")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Create a new custom order for the authenticated customer" })
  @ApiBody({ type: CreateCustomOrderDto })
  @ApiResponse({ status: 201, description: "Custom order created successfully" })
  async createCustomOrder(@CurrentTenant() tenant: AuthenticatedTenant, @Body() body: CreateCustomOrderDto) {
    try {
      const customerId = tenant?.id || tenant?.tenantId || tenant?.sub || 1;
      const res = await this.orderService.createCustomOrder(customerId, body);
      return simpleResponse(Boolean(res), res ? "Custom order created successfully." : "Failed to create custom order");
    } catch (err: any) {
      console.error("[createCustomOrder Error]:", err);
      return simpleResponse(false, "Failed to create custom order: " + (err.message || err));
    }
  }

  @Get("/get/customer/custom-order/:orderId")
  async getCustomerCustomOrder(@CurrentTenant() tenant: AuthenticatedTenant, @Param("orderId") orderId: string) {
    try {
      const order = await this.orderService.getCustomOrderById(BigInt(orderId));
      return keyedResponse("customOrder", order);
    } catch (err) {
      return keyedResponse("customOrder", null);
    }
  }

  @Get("/get/customer/custom-order-list")
  async getCustomerCustomOrderList(@CurrentTenant() tenant: AuthenticatedTenant) {
    try {
      const customerId = tenant?.id || tenant?.tenantId || tenant?.sub || 1;
      const list = await this.orderService.getCustomOrdersByTenant(customerId);
      return keyedResponse("customOrderList", list || []);
    } catch (err) {
      return keyedResponse("customOrderList", []);
    }
  }

  @Get("/get/super-user/custom-order/:orderId")
  async getSuperUserCustomOrder(@Param("orderId") orderId: string) {
    try {
      const order = await this.orderService.getCustomOrderById(BigInt(orderId));
      return keyedResponse("customOrder", order);
    } catch (err) {
      return keyedResponse("customOrder", null);
    }
  }

  @Get("/get/super-user/custom-order-list")
  async getSuperUserCustomOrderList() {
    try {
      const list = await this.orderService.getAllCustomOrders();
      return keyedResponse("customOrderList", list || []);
    } catch (err) {
      return keyedResponse("customOrderList", []);
    }
  }

  @Patch("/update/custom-order")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update custom order header details (CC emails, currency, delivery dates, order type)" })
  @ApiBody({ type: UpdateCustomOrderDto })
  @ApiResponse({ status: 200, description: "Custom order updated" })
  async updateCustomOrder(@Body() body: UpdateCustomOrderDto) {
    try {
      const res = await this.orderService.updateCustomOrder(body);
      return simpleResponse(Boolean(res), res ? "Custom order updated" : "Failed to update custom order");
    } catch (err) {
      return simpleResponse(false, "Failed to update custom order");
    }
  }

  @Post("/cancel/custom-order")
  @Patch("/cancel/custom-order")
  @Delete("/cancel/custom-order")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Cancel a custom order" })
  @ApiBody({ type: CancelCustomOrderDto })
  @ApiResponse({ status: 200, description: "Custom order cancelled" })
  async cancelCustomOrder(@CurrentTenant() tenant: AuthenticatedTenant, @Body() body: CancelCustomOrderDto) {
    try {
      const customerId = tenant?.id || tenant?.tenantId || tenant?.sub || 1;
      const orderId = BigInt(body?.orderId ?? 0);
      const res = await this.orderService.cancelCustomOrder(orderId, customerId);
      return simpleResponse(res, res ? "Custom order cancelled" : "Failed to cancel custom order");
    } catch (err) {
      return simpleResponse(false, "Failed to cancel custom order");
    }
  }

  @Get(["/get/customer/custom-order/:orderId/fulfillment-list", "/get/customer/custom-order/:orderId/fulfill"])
  @ApiOperation({ summary: "Get fulfillment list for a customer custom order" })
  @ApiParam({ name: "orderId", description: "Custom Order ID", example: 2440968, type: Number })
  @ApiResponse({ status: 200, description: "Fulfillment list" })
  async getCustomOrderFulfillmentList(@Param("orderId") orderId: string) {
    return keyedResponse("fulfillmentList", []);
  }

  @Delete("/delete/custom-order/:orderId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Permanently delete a custom order (super user)" })
  @ApiParam({ name: "orderId", description: "Custom Order ID", example: 2440968, type: Number })
  @ApiResponse({ status: 200, description: "Custom order deleted" })
  async deleteCustomOrder(@Param("orderId") orderId: string) {
    try {
      const res = await this.orderService.deleteCustomOrder(BigInt(orderId));
      return simpleResponse(res, res ? "Custom order deleted" : "Failed to delete custom order");
    } catch (err) {
      return simpleResponse(false, "Failed to delete custom order");
    }
  }
}
