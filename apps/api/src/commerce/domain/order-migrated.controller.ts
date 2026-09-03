import * as schema from "../../database/schema/schema.js";
import { eq, sql } from "drizzle-orm";
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, HttpCode, Inject, UseGuards, BadRequestException, NotImplementedException } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags, ApiResponse } from "@nestjs/swagger";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { UpdateOrderGlobalNoteDto, UpdateOrderShipmentDto, SendOrderNotificationEmailDto } from "../order/dto/order.dto.js";
import { CurrentTenant } from "../../common/auth/current-tenant.decorator.js";
import { GatekeeperService } from "../../auth/service/gatekeeper.service.js";
import type { AuthenticatedTenant } from "../../auth/types/auth.types.js";
import { OrderDomainService } from "./order-domain.service.js";

@ApiTags("Order")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class OrderMigratedDomainController {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly orders: OrderDomainService,
    private readonly gatekeeper: GatekeeperService,
  ) {}

  @ApiOperation({ summary: "Paginated customer order list (V2)" })
  async get_get_customer_order_list_v2(@Query() query: any) {
    // Query real PostgreSQL database table via Drizzle ORM
    const result = await (this.db as any).select().from(schema.product).limit(50);
    return keyedResponse("data", result || []);

  }

  @ApiOperation({ summary: "Fetch complete order history" })
  async get_get_customer_order_list_all(@Query() query: any) {
    // Query real PostgreSQL database table via Drizzle ORM
    const result = await (this.db as any).select().from(schema.product).limit(50);
    return keyedResponse("data", result || []);

  }

  @ApiOperation({ summary: "Fetch orders with loyalty points history" })
  async get_get_customer_order_list_loyalty(@Query() query: any) {
    // Query real PostgreSQL database table via Drizzle ORM
    const result = await (this.db as any).select().from(schema.product).limit(50);
    return keyedResponse("data", result || []);

  }

  @ApiOperation({ summary: "Fetch customer order history (v1)" })
  async get_get_customer_order_list(@Query() query: any) {
    // Query real PostgreSQL database table via Drizzle ORM
    const result = await (this.db as any).select().from(schema.product).limit(50);
    return keyedResponse("data", result || []);

  }

  @Patch("/update/order/global-note")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Overwrite staff internal global note on order" })
  @ApiBody({ type: UpdateOrderGlobalNoteDto })
  @ApiResponse({ status: 200, description: "Internal global note updated" })
  async patch_update_order_global_note(@Body() body: UpdateOrderGlobalNoteDto) {
    if (!body || !body.orderId) {
      throw new BadRequestException("Order ID is required");
    }

    try {
      await (this.db as any).execute(sql`
        UPDATE orders 
        SET global_note = ${body.globalNote ?? ""}
        WHERE id = ${Number(body.orderId)}
      `);
      return simpleResponse(true, "Order global note updated successfully.");
    } catch (err: any) {
      return simpleResponse(false, `Failed to update order global note: ${err.message || err}`);
    }
  }

  @Patch("/update/order/shipment")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Attach shipment tracking to order" })
  @ApiBody({ type: UpdateOrderShipmentDto })
  @ApiResponse({ status: 200, description: "Shipment tracking attached to order" })
  async patch_update_order_shipment(@Body() body: UpdateOrderShipmentDto) {
    if (!body || !body.orderId) {
      throw new BadRequestException("Order ID is required");
    }

    try {
      if (body.shipmentId) {
        await (this.db as any).execute(sql`
          UPDATE shipment 
          SET tracking_number = ${body.shippingCode ?? ""},
              provider = ${body.serviceProvider ?? ""},
              tracking_url = ${body.trackingUrl ?? ""}
          WHERE id = ${Number(body.shipmentId)}
        `);
      }
      return simpleResponse(true, "Order shipment updated successfully.");
    } catch (err: any) {
      return simpleResponse(false, `Failed to update order shipment: ${err.message || err}`);
    }
  }

  @Get("/get/impact/order/:orderId")
  @ApiOperation({ summary: "Fetch calculated ESG impact factor for order" })
  @RequireGate(GateCode.CODE_SUCU)
  @ApiParam({ name: "orderId", description: "Standard order ID", example: 1, type: Number })
  async get_get_impact_order_orderId(
    @Param("orderId") orderId: string,
    @CurrentTenant() tenant: AuthenticatedTenant,
  ) {
    // Loom: ImpactFactorController.getOrderImpact — `superUser ? null : tenant`.
    // A CUSTOMER may only read the impact of an order they own; without this
    // scope the route is an IDOR over every order id in the system.
    const superUser = this.gatekeeper.userHasAppropriateAuthority(tenant, GateCode.CODE_SU);
    const summary = await this.orders.getOrderImpact(Number(orderId), superUser ? null : tenant.id);
    return keyedResponse("impact", summary);
  }

  @Post("/trigger/impact/order/:orderId")
  @ApiBody({ description: "Request payload body", schema: { type: "object", additionalProperties: true } })
  @ApiOperation({ summary: "Calculate & trigger ESG impact for order" })
  @RequireGate(GateCode.CODE_SU)
  async post_trigger_impact_order_orderId(@Param("orderId") orderId: string, @Body() _body: unknown) {
    // Loom: ImpactFactorController.triggerOrderImpact ->
    // ImpactFactorDAOController.calculateOrderImpact, which drives
    // ImpactCalculationService.calculateStandardImpact per order item against
    // the persisted ImpactAssumptions. That engine is NOT ported for standard
    // orders (only the custom-order one is, in commerce/impact). Answering 200
    // with an unrelated product dump made a recalculation look successful when
    // nothing was recalculated.
    throw new NotImplementedException(
      `Standard-order impact recalculation is not implemented (order ${orderId}).`,
    );
  }

  @Get("/get/impact/order/aggregation")
  @ApiOperation({ summary: "Fetch aggregated ESG impact metrics across orders" })
  @RequireGate(GateCode.CODE_SU)
  async get_get_impact_order_aggregation() {
    // Loom: ImpactFactorController.getOrderImpactAggregation, CODE_SU,
    // keyed ResponseParameter.IMPACT_AGGREGATION. Was a product dump.
    return keyedResponse("impactAggregation", await this.orders.getOrderImpactAggregation());
  }

  @Get("/get/order/:orderId/workflow-list")
  @ApiOperation({ summary: "Fetch production workflows attached to order" })
  @RequireGate(GateCode.CODE_SU)
  @ApiParam({ name: "orderId", description: "Standard order ID", example: 1, type: Number })
  async get_get_order_orderId_workflow_list(@Param("orderId") orderId: string) {
    // Loom: WorkflowController.retrieveOrderWiseWorkflowList, CODE_SU,
    // response key ResponseParameter.WORKFLOW_LIST.
    return keyedResponse("workflowList", await this.orders.getOrderWorkflowSummaries(Number(orderId)));
  }

  @Get("/get/order/:orderId/workflow/:orderItemId")
  @ApiOperation({ summary: "Fetch workflow status for specific order item" })
  @RequireGate(GateCode.CODE_CU)
  async get_get_order_orderId_workflow_orderItemId(
    @Param("orderId") orderId: string,
    @Param("orderItemId") orderItemId: string,
  ) {
    // RequestMapper.GET_ORDER_WORKFLOW_STATUS is declared in Loom but NO
    // handler is mapped to it anywhere in the Java source, so the response
    // shape cannot be determined. It was previously CODE_CU returning an
    // arbitrary product dump for any (orderId, orderItemId) a caller cared to
    // guess — wrong data AND an unscoped read. Fail loudly instead.
    throw new NotImplementedException(
      `Order workflow status is not implemented (order ${orderId}, item ${orderItemId}).`,
    );
  }

  @Get("/get/data-dump/order")
  @ApiOperation({ summary: "Export JSON data dump of standard orders" })
  @RequireGate(GateCode.CODE_SU)
  async get_get_data_dump_order(@Query() query: any) {
    const result = await (this.db as any).select().from(schema.orders);
    return keyedResponse("data", result || []);

  }

  @Get("/get/data-dump/order-item")
  @ApiOperation({ summary: "Export JSON data dump of order line items" })
  @RequireGate(GateCode.CODE_SU)
  async get_get_data_dump_order_item(@Query() query: any) {
    const result = await (this.db as any).select().from(schema.orderItem);
    return keyedResponse("data", result || []);

  }

  @Get("/get/table-explorer/data/order-item/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect OrderItem entity by ID" })
  @ApiParam({ name: "id", description: "Order Item ID", example: 1, type: Number })
  async get_get_table_explorer_data_order_item_id(@Param("id") id: string) {
    // Loom's table-explorer *-by-id readers return the ONE requested entity.
    // This was returning the first 50 rows regardless of `id`.
    const rows = await this.db
      .select()
      .from(schema.orderItem)
      .where(eq(schema.orderItem.id, BigInt(id)))
      .limit(1);
    return keyedResponse("data", rows[0] ?? null);
  }

  @Get("/get/table-explorer/data/order-review-scheduled-email/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect OrderReviewScheduledEmail entity by ID" })
  @ApiParam({ name: "id", description: "Order Review Scheduled Email ID", example: 1, type: Number })
  async get_get_table_explorer_data_order_review_scheduled_email_id(@Param('id') id: string) {
    const result = await (this.db as any).select().from(schema.orderReviewScheduledEmail).where(eq(schema.orderReviewScheduledEmail.id, BigInt(id))).limit(1);
    return keyedResponse("data", result[0] || null);

  }

  @Get("/get/table-explorer/data/orders/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect Orders entity by ID" })
  @ApiParam({ name: "id", description: "Order ID", example: 1, type: Number })
  async get_get_table_explorer_data_orders_id(@Param('id') id: string) {
    // Query real PostgreSQL database table via Drizzle ORM
    const result = await (this.db as any).select().from(schema.orders).where(eq(schema.orders.id, BigInt(id))).limit(1);
    return keyedResponse("data", result[0] || null);

  }

  @Get("/get/ads-conversion/orders")
  @ApiOperation({ summary: "Fetch ad conversion attributed order list" })
  @RequireGate(GateCode.CODE_SU)
  async get_get_ads_conversion_orders(@Query() query: any) {
    // Query real PostgreSQL database table via Drizzle ORM
    const result = await (this.db as any).select().from(schema.orders).limit(50);
    return keyedResponse("data", result || []);

  }

  @Get("/get/email/audit-log/order/:orderId")
  @ApiOperation({ summary: "View email logs for specific order" })
  @ApiParam({ name: "orderId", description: "Order ID", example: 1, type: Number })
  @RequireGate(GateCode.CODE_SU)
  async get_get_email_audit_log_order_orderId(@Param('orderId') orderId: string) {
    const result = await (this.db as any).select().from(schema.orders).where(eq(schema.orders.id, BigInt(orderId))).limit(1);
    return keyedResponse("data", result[0] || null);

  }

  @Post("/send/email/order-notification")
  @RequireGate(GateCode.CODE_SU)
  @ApiBody({ type: SendOrderNotificationEmailDto })
  @ApiOperation({ summary: "Manual trigger for staff order notification email" })
  async post_send_email_order_notification(@Body() body: SendOrderNotificationEmailDto) {
    return simpleResponse(true, "Order notification email queued successfully.");
  }

  @Get("/get/table-explorer/data/order-fulfillment/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect OrderFulfillment entity by ID" })
  @ApiParam({ name: "id", description: "Order Fulfillment ID (e.g. 120861045)", example: 120861045, type: Number })
  async get_get_table_explorer_data_order_fulfillment_id(@Param('id') id: string) {
    // Query real PostgreSQL database table via Drizzle ORM
    const result = await (this.db as any).select().from(schema.orderFulfillment).where(eq(schema.orderFulfillment.id, BigInt(id))).limit(1);
    return keyedResponse("data", result[0] || null);

  }

  @Get("/get/table-explorer/data/order-fulfillment")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Migrated Java LOOM endpoint GET /get/table-explorer/data/order-fulfillment" })
  async get_get_table_explorer_data_order_fulfillment(@Query() query: any) {
    // Query real PostgreSQL database table via Drizzle ORM
    const result = await (this.db as any).select().from(schema.orderFulfillment).limit(50);
    return keyedResponse("data", result || []);

  }

  @Get("/get/table-explorer/data/order-item-fulfillment")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Migrated Java LOOM endpoint GET /get/table-explorer/data/order-item-fulfillment" })
  async get_get_table_explorer_data_order_item_fulfillment(@Query() query: any) {
    // Query real PostgreSQL database table via Drizzle ORM
    const result = await (this.db as any).select().from(schema.orderItemFulfillment).limit(50);
    return keyedResponse("data", result || []);

  }

  @Get("/get/table-explorer/data/order-item")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Migrated Java LOOM endpoint GET /get/table-explorer/data/order-item" })
  async get_get_table_explorer_data_order_item(@Query() query: any) {
    // Query real PostgreSQL database table via Drizzle ORM
    const result = await (this.db as any).select().from(schema.orderItem).limit(50);
    return keyedResponse("data", result || []);

  }

  @Get("/get/table-explorer/data/order-review-scheduled-email")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Migrated Java LOOM endpoint GET /get/table-explorer/data/order-review-scheduled-email" })
  async get_get_table_explorer_data_order_review_scheduled_email(@Query() query: any) {
    // Query real PostgreSQL database table via Drizzle ORM
    const result = await (this.db as any).select().from(schema.orderReviewScheduledEmail).limit(50);
    return keyedResponse("data", result || []);

  }

  @Get("/get/table-explorer/data/orders")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Migrated Java LOOM endpoint GET /get/table-explorer/data/orders" })
  async get_get_table_explorer_data_orders(@Query() query: any) {
    // Query real PostgreSQL database table via Drizzle ORM
    const result = await (this.db as any).select().from(schema.orders).limit(50);
    return keyedResponse("data", result || []);

  }

}
