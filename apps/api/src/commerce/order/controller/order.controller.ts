import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Req, UnauthorizedException, NotFoundException } from "@nestjs/common";
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
  async addOrder(@Body() body: any, @CurrentTenant() tenant?: AuthenticatedTenant) {
    const order = await this.orderService.createOrder(body, tenant?.tenantId || tenant?.id);
    if (order) {
      const orderId = Number(order.id);
      return {
        success: true,
        message: String(orderId),
        payload: orderId,
        orderId,
        data: order,
        entity: order,
      };
    }
    return simpleResponse(false, "Failed to create order.");
  }

  @Get("/get/customer/order/:orderId")
  @RequireGate(GateCode.CODE_CU)
  async getCustomerOrder(@CurrentTenant() tenant: AuthenticatedTenant, @Param("orderId") orderId: string) {
    const result = await this.orderService.getOrderById(BigInt(orderId));
    // Order ids are sequential bigints, so without this check any logged-in
    // customer could walk them and read every buyer's address, email and totals.
    // 404 rather than 403 — a 403 confirms the id exists.
    const callerId = Number(tenant?.tenantId ?? tenant?.id);
    const ownerId = Number((result as { tenantId?: number | bigint })?.tenantId);
    if (!result || !callerId || ownerId !== callerId) {
      throw new NotFoundException("Order not found.");
    }
    return keyedResponse("order", result);
  }

  @Get("/get/customer/order-list")
  @RequireGate(GateCode.CODE_CU)
  async getCustomerOrderList(@CurrentTenant() tenant: AuthenticatedTenant, @Query("page") page: string = "0", @Query("size") size: string = "10") {
    const result = await this.orderService.getCustomerOrders(tenant?.tenantId ?? tenant?.id, parseInt(page, 10), parseInt(size, 10));
    return keyedResponse("orderList", result);
  }

  // ─── Loom OrderController: the three customer order-list reads ─────────────
  // Every one is CODE_CU and resolves the tenant from the JWT
  // (getAuthorityResolver().resolveUserInformationFromAuthorizationToken) — the
  // tenant is NEVER taken from a query param, so neither is it here. Loom's
  // query params are pageNumber/pageSize with defaults 0/50; the storefront
  // sends neither, so the defaults are load-bearing.

  @Get("/get/customer/order-list/v2")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Customer's regular order previews (Loom getCustomerOrderList)." })
  @ApiQuery({ name: "pageNumber", required: false, example: 0 })
  @ApiQuery({ name: "pageSize", required: false, example: 50 })
  async getCustomerOrderListV2(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Query("pageNumber") pageNumber = "0",
    @Query("pageSize") pageSize = "50",
  ) {
    const result = await this.orderService.getCustomerOrderPreviews(
      tenantIdOf(tenant),
      pageOf(pageNumber, 0),
      pageOf(pageSize, 50),
    );
    return keyedResponse("orderList", result);
  }

  @Get("/get/customer/order-list/all")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Customer's regular + custom order previews (Loom getCustomerAllOrderList)." })
  @ApiQuery({ name: "pageNumber", required: false, example: 0 })
  @ApiQuery({ name: "pageSize", required: false, example: 50 })
  async getCustomerAllOrderList(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Query("pageNumber") pageNumber = "0",
    @Query("pageSize") pageSize = "50",
  ) {
    const result = await this.orderService.getCustomerAllOrderPreviews(
      tenantIdOf(tenant),
      pageOf(pageNumber, 0),
      pageOf(pageSize, 50),
    );
    return keyedResponse("orderList", result);
  }

  // Loom uses getEntityCustomResponse here, so the envelope key is `entity`,
  // not a `…List` key. Payload is ProcessingOrderStatus {hasProcessingOrder}.
  @Get("/get/customer/orders/status/processing")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Whether the customer has any PROCESSING order (Loom getProcessingOrderStatus)." })
  @ApiQuery({ name: "pageNumber", required: false, example: 0 })
  @ApiQuery({ name: "pageSize", required: false, example: 50 })
  async getProcessingOrderStatus(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Query("pageNumber") pageNumber = "0",
    @Query("pageSize") pageSize = "50",
  ) {
    const status = await this.orderService.getProcessingOrderStatus(
      tenantIdOf(tenant),
      pageOf(pageNumber, 0),
      pageOf(pageSize, 50),
    );
    return keyedResponse("entity", status);
  }

  @Get("/get/order/loyalty/info")
  @ApiOperation({ summary: "Get order loyalty points info." })
  @RequireGate(GateCode.CODE_CU)
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

/**
 * The authenticated tenant's id. Throws rather than falling back to a
 * default/first tenant: a customer-scoped list that silently widens its scope
 * is an IDOR, so a missing tenant must fail loudly.
 */
function tenantIdOf(tenant: AuthenticatedTenant | undefined): number {
  const id = Number(tenant?.tenantId ?? tenant?.id ?? 0);
  if (!Number.isInteger(id) || id <= 0) {
    throw new UnauthorizedException("No authenticated tenant on the request.");
  }
  return id;
}

/** Loom parses these with Integer.parseInt and 500s on junk; we fall back. */
function pageOf(raw: string, fallback: number): number {
  const n = Number.parseInt(raw, 10);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}
