// @ts-nocheck
import * as schema from "../../database/schema/schema.js";
import { eq, desc, asc, and, sql } from "drizzle-orm";
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
  BadRequestException,
  NotFoundException
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags
} from "@nestjs/swagger";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";
import {
  UpdateCustomOrderGlobalNoteDto,
  UpdateCustomOrderItemDto,
  AddCustomOrderItemsDto,
  UpdateCustomOrderShipmentDto,
  UpdateCustomOrderInfoDto,
  AddCustomOrderFulfillmentDto,
  UpdateCustomOrderFulfillmentDto,
  AddCustomOrderReadyDto,
  UpdateCustomOrderReadyDto,
  AddCustomOrderAdjustmentDto,
  UpdateCustomOrderAdjustmentDto
} from "../order/dto/custom-order-admin.dto.js";

@ApiTags("Custom Order")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class CustomOrderMigratedDomainController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  @Get("/get/customer/custom-order/:orderId/fulfill")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Custom order fulfillment status tracking" })
  @ApiParam({ name: "orderId", description: "Custom Order ID", example: 1 })
  async get_get_customer_custom_order_orderId_fulfill(@Param("orderId") orderId: string) {
    try {
      const fulfillments = await (this.db as any)
        .select()
        .from(schema.customOrderFulfillment)
        .where(eq(schema.customOrderFulfillment.customOrderId, Number(orderId)));
      return keyedResponse("fulfillmentList", fulfillments || []);
    } catch (err) {
      return keyedResponse("fulfillmentList", []);
    }
  }

  @Get("/get/customer/custom-order/:orderId/fulfillment-list")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Fetch custom order shipment fulfillment status" })
  @ApiParam({ name: "orderId", description: "Custom Order ID", example: 1 })
  async get_get_customer_custom_order_orderId_fulfillment_list(@Param("orderId") orderId: string) {
    try {
      const fulfillments = await (this.db as any)
        .select()
        .from(schema.customOrderFulfillment)
        .where(eq(schema.customOrderFulfillment.customOrderId, Number(orderId)));
      return keyedResponse("fulfillmentList", fulfillments || []);
    } catch (err) {
      return keyedResponse("fulfillmentList", []);
    }
  }

  @Patch("/update/custom-order/global-note")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update internal global note on custom order" })
  @ApiBody({ type: UpdateCustomOrderGlobalNoteDto })
  @ApiResponse({ status: 200, description: "Internal global note updated" })
  async patch_update_custom_order_global_note(@Body() body: UpdateCustomOrderGlobalNoteDto) {
    if (!body || !body.orderId) {
      throw new BadRequestException("Order ID is required");
    }

    // The DB table uses 'note' column (global_note not present in current schema)
    await (this.db as any).execute(sql`
      UPDATE custom_order 
      SET note = ${body.globalNote ?? ""}
      WHERE id = ${Number(body.orderId)}
    `);

    return simpleResponse(true, "Custom order global note updated successfully.");
  }


  @Patch("/update/custom-order-item")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Edit custom order line item" })
  @ApiBody({ type: UpdateCustomOrderItemDto })
  @ApiResponse({ status: 200, description: "Custom order line item updated" })
  async patch_update_custom_order_item(@Body() body: UpdateCustomOrderItemDto) {
    if (!body || !body.orderItemId) {
      throw new BadRequestException("Order Item ID is required");
    }

    try {
      const [updatedItem] = await (this.db as any)
        .update(schema.customOrderItem)
        .set({
          quantity: String(body.quantity),
          price: String(body.price),
          updatedAt: Date.now()
        })
        .where(eq(schema.customOrderItem.id, Number(body.orderItemId)))
        .returning();
      return simpleResponse(true, "Custom order item updated successfully.");
    } catch (err: any) {
      await (this.db as any).execute(sql`
        UPDATE custom_order_item
        SET quantity = ${String(body.quantity)}, price = ${String(body.price)}, updated_at = ${Date.now()}
        WHERE id = ${Number(body.orderItemId)}
      `);
      return simpleResponse(true, "Custom order item updated successfully.");
    }
  }

  @Patch("/add/custom-order-items")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Add line items to custom order" })
  @ApiBody({ type: AddCustomOrderItemsDto })
  @ApiResponse({ status: 200, description: "Custom order items added" })
  async patch_add_custom_order_items(@Body() body: AddCustomOrderItemsDto) {
    if (!body || !body.orderId || !Array.isArray(body.customOrderItemList)) {
      throw new BadRequestException("Order ID and customOrderItemList are required");
    }

    const now = Date.now();
    for (const item of body.customOrderItemList) {
      await (this.db as any)
        .insert(schema.customOrderItem)
        .values({
          customOrderId: Number(body.orderId),
          productGroup: item.productGroup || "fabric",
          orderType: item.orderType || "MADE_TO_ORDER",
          quantity: String(item.quantity || 1),
          unit: item.unit || "METER",
          price: String(item.price || 0),
          currency: item.currency || "INR",
          customization: item.customization || {},
          orderStatus: "PENDING",
          createdAt: now,
          updatedAt: now,
          description: item.description || ""
        });
    }

    return simpleResponse(true, "Custom order items added successfully.");
  }

  @Patch("/update/custom-order/shipment")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Attach shipment tracking to custom order" })
  @ApiBody({ type: UpdateCustomOrderShipmentDto })
  @ApiResponse({ status: 200, description: "Custom order shipment updated" })
  async patch_update_custom_order_shipment(@Body() body: UpdateCustomOrderShipmentDto) {
    if (!body || !body.orderId) {
      throw new BadRequestException("Order ID is required");
    }

    await (this.db as any)
      .update(schema.customOrderItem)
      .set({
        shippingCode: body.shippingCode || "",
        trackingUrl: body.trackingUrl || "",
        zohoPackageId: body.zohoPackageId || "",
        updatedAt: Date.now()
      })
      .where(eq(schema.customOrderItem.customOrderId, Number(body.orderId)));

    return simpleResponse(true, "Custom order shipment updated successfully.");
  }

  @Patch("/update/custom-order-info")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update custom order header info" })
  @ApiBody({ type: UpdateCustomOrderInfoDto })
  @ApiResponse({ status: 200, description: "Custom order info updated" })
  async patch_update_custom_order_info(@Body() body: UpdateCustomOrderInfoDto) {
    if (!body || !body.orderId) {
      throw new BadRequestException("Order ID is required");
    }

    await (this.db as any)
      .update(schema.customOrder)
      .set({
        ...(body.ccEmails !== undefined ? { ccEmails: body.ccEmails } : {}),
        ...(body.currency !== undefined ? { currency: body.currency } : {}),
        ...(body.orderType !== undefined ? { orderType: body.orderType } : {}),
        ...(body.loyaltyOrder !== undefined ? { loyaltyOrder: body.loyaltyOrder } : {})
      })
      .where(eq(schema.customOrder.id, Number(body.orderId)));

    return simpleResponse(true, "Custom order info updated successfully.");
  }

  @Delete("/delete/custom-order-item/:orderItemId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete line item from custom order" })
  @ApiParam({ name: "orderItemId", description: "Custom Order Item ID", example: 1 })
  @ApiResponse({ status: 200, description: "Custom order item deleted" })
  async delete_delete_custom_order_item_orderItemId(@Param("orderItemId") orderItemId: string) {
    const id = Number(orderItemId);
    if (!id) {
      throw new BadRequestException("Invalid order item ID");
    }

    await (this.db as any)
      .delete(schema.customOrderItem)
      .where(eq(schema.customOrderItem.id, id));

    return simpleResponse(true, "Custom order item deleted successfully.");
  }

  @Post("/add/custom-order/fulfillment")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Add fulfillment step to custom order" })
  @ApiBody({ type: AddCustomOrderFulfillmentDto })
  @ApiResponse({ status: 201, description: "Custom order fulfillment created" })
  async post_add_custom_order_fulfillment(@Body() body: AddCustomOrderFulfillmentDto) {
    if (!body || !body.customOrderId) {
      throw new BadRequestException("Custom Order ID is required");
    }

    const [fulfillment] = await (this.db as any)
      .insert(schema.customOrderFulfillment)
      .values({
        customOrderId: Number(body.customOrderId),
        shipmentId: body.shipmentId ? Number(body.shipmentId) : null,
        shippingCode: body.shippingCode || "",
        trackingUrl: body.trackingUrl || "",
        note: body.note || "",
        dispatchedOn: Date.now()
      })
      .returning();

    if (body.customOrderItemFulfillmentList && Array.isArray(body.customOrderItemFulfillmentList)) {
      for (const item of body.customOrderItemFulfillmentList) {
        await (this.db as any)
          .insert(schema.customOrderItemFulfillment)
          .values({
            customOrderId: Number(body.customOrderId),
            customOrderFulfillmentId: Number(fulfillment.id),
            customOrderItemId: Number(item.customOrderItemId),
            quantity: String(item.quantity)
          });
      }
    }

    return simpleResponse(true, "Custom order fulfillment added successfully.");
  }

  @Patch("/update/custom-order/fulfillment")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update fulfillment step on custom order" })
  @ApiBody({ type: UpdateCustomOrderFulfillmentDto })
  @ApiResponse({ status: 200, description: "Custom order fulfillment updated" })
  async patch_update_custom_order_fulfillment(@Body() body: UpdateCustomOrderFulfillmentDto) {
    if (!body || !body.customOrderFulfillmentId) {
      throw new BadRequestException("Fulfillment ID is required");
    }

    await (this.db as any)
      .update(schema.customOrderFulfillment)
      .set({
        ...(body.shippingCode !== undefined ? { shippingCode: body.shippingCode } : {}),
        ...(body.trackingUrl !== undefined ? { trackingUrl: body.trackingUrl } : {}),
        ...(body.note !== undefined ? { note: body.note } : {})
      })
      .where(eq(schema.customOrderFulfillment.id, Number(body.customOrderFulfillmentId)));

    return simpleResponse(true, "Custom order fulfillment updated successfully.");
  }

  @Post("/add/custom-order/ready")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Mark custom order item ready" })
  @ApiBody({ type: AddCustomOrderReadyDto })
  @ApiResponse({ status: 201, description: "Custom order ready created" })
  async post_add_custom_order_ready(@Body() body: AddCustomOrderReadyDto) {
    if (!body || !body.customOrderId) {
      throw new BadRequestException("Custom Order ID is required");
    }

    const [ready] = await (this.db as any)
      .insert(schema.customOrderReady)
      .values({
        customOrderId: Number(body.customOrderId),
        receivedDate: body.receivedDate || Date.now(),
        note: body.note || ""
      })
      .returning();

    if (body.customOrderItemReadyList && Array.isArray(body.customOrderItemReadyList)) {
      for (const item of body.customOrderItemReadyList) {
        await (this.db as any)
          .insert(schema.customOrderItemReady)
          .values({
            customOrderId: Number(body.customOrderId),
            customOrderReadyId: Number(ready.id),
            customOrderItemId: Number(item.customOrderItemId),
            quantity: String(item.quantity)
          });
      }
    }

    return simpleResponse(true, "Custom order ready record added successfully.");
  }

  @Patch("/update/custom-order/ready")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update custom order ready status" })
  @ApiBody({ type: UpdateCustomOrderReadyDto })
  @ApiResponse({ status: 200, description: "Custom order ready updated" })
  async patch_update_custom_order_ready(@Body() body: UpdateCustomOrderReadyDto) {
    if (!body || !body.customOrderReadyId) {
      throw new BadRequestException("Custom Order Ready ID is required");
    }

    await (this.db as any)
      .update(schema.customOrderReady)
      .set({
        ...(body.receivedDate !== undefined ? { receivedDate: body.receivedDate } : {}),
        ...(body.note !== undefined ? { note: body.note } : {})
      })
      .where(eq(schema.customOrderReady.id, Number(body.customOrderReadyId)));

    return simpleResponse(true, "Custom order ready record updated successfully.");
  }

  @Post("/add/custom-order-adjustment")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create financial adjustment on custom order" })
  @ApiBody({ type: AddCustomOrderAdjustmentDto })
  @ApiResponse({ status: 201, description: "Custom order adjustment created" })
  async post_add_custom_order_adjustment(@Body() body: AddCustomOrderAdjustmentDto) {
    if (!body || !body.customOrderId || body.amount === undefined) {
      throw new BadRequestException("Custom Order ID and amount are required");
    }

    const [adjustment] = await (this.db as any)
      .insert(schema.customOrderAdjustment)
      .values({
        customOrderId: Number(body.customOrderId),
        reason: body.reason || "",
        amount: String(body.amount),
        timeOfCreation: Date.now()
      })
      .returning();

    return keyedResponse("customOrderAdjustment", adjustment);
  }

  @Patch("/update/custom-order-adjustment")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update custom order financial adjustment" })
  @ApiBody({ type: UpdateCustomOrderAdjustmentDto })
  @ApiResponse({ status: 200, description: "Custom order adjustment updated" })
  async patch_update_custom_order_adjustment(@Body() body: UpdateCustomOrderAdjustmentDto) {
    if (!body || !body.adjustmentId) {
      throw new BadRequestException("Adjustment ID is required");
    }

    const [updated] = await (this.db as any)
      .update(schema.customOrderAdjustment)
      .set({
        ...(body.reason !== undefined ? { reason: body.reason } : {}),
        ...(body.amount !== undefined ? { amount: String(body.amount) } : {})
      })
      .where(eq(schema.customOrderAdjustment.id, Number(body.adjustmentId)))
      .returning();

    return keyedResponse("customOrderAdjustment", updated);
  }

  @Delete("/delete/custom-order-adjustment/:adjustmentId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete custom order financial adjustment" })
  @ApiParam({ name: "adjustmentId", description: "Adjustment ID", example: 1 })
  @ApiResponse({ status: 200, description: "Custom order adjustment deleted" })
  async delete_delete_custom_order_adjustment_adjustmentId(@Param("adjustmentId") adjustmentId: string) {
    const id = Number(adjustmentId);
    if (!id) {
      throw new BadRequestException("Invalid adjustment ID");
    }

    await (this.db as any)
      .delete(schema.customOrderAdjustment)
      .where(eq(schema.customOrderAdjustment.id, id));

    return simpleResponse(true, "Custom order adjustment deleted successfully.");
  }

  @Get("/get/table-explorer/data/custom-order-adjustment")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for CustomOrderAdjustment" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "size", required: false, example: 50 })
  async get_get_table_explorer_data_custom_order_adjustment(@Query() query: any) {
    const page = Math.max(1, Number(query?.page) || 1);
    const size = Math.max(1, Math.min(100, Number(query?.size) || 50));
    const offset = (page - 1) * size;

    const result = await (this.db as any)
      .select()
      .from(schema.customOrderAdjustment)
      .limit(size)
      .offset(offset);
    return keyedResponse("data", result || []);
  }

  @Get("/get/table-explorer/data/custom-order-fulfillment")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for CustomOrderFulfillment" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "size", required: false, example: 50 })
  async get_get_table_explorer_data_custom_order_fulfillment(@Query() query: any) {
    const page = Math.max(1, Number(query?.page) || 1);
    const size = Math.max(1, Math.min(100, Number(query?.size) || 50));
    const offset = (page - 1) * size;

    const result = await (this.db as any)
      .select()
      .from(schema.customOrderFulfillment)
      .limit(size)
      .offset(offset);
    return keyedResponse("data", result || []);
  }

  @Get("/get/table-explorer/data/custom-order/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for single CustomOrder" })
  @ApiParam({ name: "id", example: 1 })
  async get_get_table_explorer_data_custom_order_id(@Param("id") id: string) {
    const [result] = await (this.db as any)
      .select()
      .from(schema.customOrder)
      .where(eq(schema.customOrder.id, Number(id)))
      .limit(1);
    return keyedResponse("data", result || null);
  }

  @Get("/get/table-explorer/data/custom-order-item-fulfillment")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for CustomOrderItemFulfillment" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "size", required: false, example: 50 })
  async get_get_table_explorer_data_custom_order_item_fulfillment(@Query() query: any) {
    const page = Math.max(1, Number(query?.page) || 1);
    const size = Math.max(1, Math.min(100, Number(query?.size) || 50));
    const offset = (page - 1) * size;

    const result = await (this.db as any)
      .select()
      .from(schema.customOrderItemFulfillment)
      .limit(size)
      .offset(offset);
    return keyedResponse("data", result || []);
  }

  @Get("/get/table-explorer/data/custom-order-item")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for CustomOrderItem" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "size", required: false, example: 50 })
  async get_get_table_explorer_data_custom_order_item(@Query() query: any) {
    const page = Math.max(1, Number(query?.page) || 1);
    const size = Math.max(1, Math.min(100, Number(query?.size) || 50));
    const offset = (page - 1) * size;

    const result = await (this.db as any)
      .select()
      .from(schema.customOrderItem)
      .limit(size)
      .offset(offset);
    return keyedResponse("data", result || []);
  }

  @Get("/get/table-explorer/data/custom-order")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for CustomOrder list" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "size", required: false, example: 50 })
  async get_get_table_explorer_data_custom_order(@Query() query: any) {
    const page = Math.max(1, Number(query?.page) || 1);
    const size = Math.max(1, Math.min(100, Number(query?.size) || 50));
    const offset = (page - 1) * size;

    const result = await (this.db as any)
      .select()
      .from(schema.customOrder)
      .limit(size)
      .offset(offset);
    return keyedResponse("data", result || []);
  }
}
