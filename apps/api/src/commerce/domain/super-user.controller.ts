import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Inject,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";
import * as schema from "../../database/schema/schema.js";
import { eq, desc, sql, ilike, or } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";

export class SuperUserRegistrationDto {
  @ApiProperty({ example: 1, description: "Tenant ID to assign as Super User" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  tenantId!: number;

  @ApiPropertyOptional({ example: "admin@anuprerna.com", description: "Super User Email" })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: "Super Administrator", description: "Full Name" })
  @IsOptional()
  @IsString()
  name?: string;
}

function formatSuperUser(u: any) {
  if (!u) return null;
  return {
    id: u.id ? String(u.id) : null,
    version: u.version ? Number(u.version) : 0,
    tenantId: u.tenantId ? String(u.tenantId) : null,
  };
}

function formatOrderRow(o: any) {
  if (!o) return null;
  return {
    id: o.id ? String(o.id) : null,
    version: o.version ? Number(o.version) : 0,
    tenantId: o.tenantId ? String(o.tenantId) : null,
    subTotal: o.subTotal ? parseFloat(String(o.subTotal)) : 0,
    shippingCost: o.shippingCost ? parseFloat(String(o.shippingCost)) : 0,
    total: o.total ? parseFloat(String(o.total)) : 0,
    currency: o.currency || "INR",
    advancePay: o.advancePay ? parseFloat(String(o.advancePay)) : 0,
    remainingPay: o.remainingPay ? parseFloat(String(o.remainingPay)) : 0,
    couponCode: o.couponCode || null,
    couponDiscount: o.couponDiscount ? parseFloat(String(o.couponDiscount)) : 0,
    address: o.address || null,
    note: o.note || null,
    createdAt: o.createdAt ? Number(o.createdAt) : null,
    zohoOrderId: o.zohoOrderId || null,
    utmSource: o.utmSource || null,
    utmMedium: o.utmMedium || null,
    utmCampaign: o.utmCampaign || null,
    clickId: o.clickId || null,
  };
}

@ApiTags("Super User")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class SuperUserDomainController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  @Post("/super-user/registration")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Register new admin/superuser account" })
  @ApiBody({ type: SuperUserRegistrationDto })
  @ApiResponse({ status: 201, description: "Superuser registered" })
  async post_super_user_registration(@Body() body: SuperUserRegistrationDto) {
    // Loom's createNewSuperUser never guesses a tenant — registering without a
    // tenant id must fail, not silently grant super-user on tenant 1.
    if (!body?.tenantId) throw new BadRequestException("tenantId is required");

    const [inserted] = await this.db
      .insert(schema.superUser)
      .values({
        tenantId: Number(body.tenantId),
      })
      .returning();

    return keyedResponse("data", inserted ? [formatSuperUser(inserted)] : []);
  }

  @Get("/get/super-user/order-list/search")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Search superuser order directory" })
  @ApiQuery({ name: "text", example: "278006", required: false, description: "Search query by order ID or currency" })
  @ApiQuery({ name: "limit", example: 20, required: false })
  @ApiResponse({ status: 200, description: "Matching orders directory list" })
  async get_get_super_user_order_list_search(@Query("text") text?: string, @Query("limit") limit = "20") {
    try {
      const parsedLimit = parseInt(limit, 10) || 20;
      let rows: any[];

      if (text && text.trim().length > 0) {
        const queryText = text.trim();
        if (!isNaN(Number(queryText))) {
          rows = await this.db
            .select()
            .from(schema.orders)
            .where(eq(schema.orders.id, BigInt(queryText)))
            .limit(parsedLimit);
        } else {
          rows = await this.db
            .select()
            .from(schema.orders)
            .where(ilike(schema.orders.currency, `%${queryText}%`))
            .orderBy(desc(schema.orders.id))
            .limit(parsedLimit);
        }
      } else {
        rows = await this.db
          .select()
          .from(schema.orders)
          .orderBy(desc(schema.orders.id))
          .limit(parsedLimit);
      }

      const formatted = (rows || []).map(formatOrderRow);
      return {
        success: true,
        message: "",
        data: formatted,
        orderList: formatted,
      };
    } catch (err) {
      return { success: true, message: "", data: [], orderList: [] };
    }
  }

  @Get("/get/super-user/custom-order-list/search")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Search custom orders directory" })
  @ApiQuery({ name: "text", example: "2440968", required: false, description: "Search query by custom order ID" })
  @ApiQuery({ name: "limit", example: 20, required: false })
  @ApiResponse({ status: 200, description: "Matching custom orders list" })
  async get_get_super_user_custom_order_list_search(@Query("text") text?: string, @Query("limit") limit = "20") {
    try {
      const parsedLimit = parseInt(limit, 10) || 20;
      let rows: any[];

      if (text && !isNaN(Number(text.trim()))) {
        rows = await this.db
          .select()
          .from(schema.customOrder)
          .where(eq(schema.customOrder.id, BigInt(text.trim())))
          .limit(parsedLimit);
      } else {
        rows = await this.db
          .select()
          .from(schema.customOrder)
          .orderBy(desc(schema.customOrder.id))
          .limit(parsedLimit);
      }

      const formatted = (rows || []).map(r => ({
        id: r.id ? String(r.id) : null,
        version: r.version ? Number(r.version) : 0,
        tenantId: r.tenantId ? String(r.tenantId) : null,
        status: r.status,
        total: r.total ? parseFloat(String(r.total)) : 0,
        currency: r.currency || "INR",
        advancePay: r.advancePay ? parseFloat(String(r.advancePay)) : 0,
        remainingPay: r.remainingPay ? parseFloat(String(r.remainingPay)) : 0,
        createdAt: r.createdAt ? Number(r.createdAt) : null,
      }));

      return {
        success: true,
        message: "",
        data: formatted,
        customOrderList: formatted,
      };
    } catch (err) {
      return { success: true, message: "", data: [], customOrderList: [] };
    }
  }

  @Get("/get/super-user/custom-order/:orderId/fulfillment-list")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch custom order fulfillment status" })
  @ApiParam({ name: "orderId", example: 2440968, type: Number })
  @ApiResponse({ status: 200, description: "Custom order fulfillment list" })
  async get_get_super_user_custom_order_orderId_fulfillment_list(@Param("orderId") orderId: string) {
    try {
      const rows = await this.db
        .select()
        .from(schema.customOrderFulfillment)
        .where(eq(schema.customOrderFulfillment.customOrderId, Number(orderId)));
      return keyedResponse("data", rows || []);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/super-user/custom-order/:orderId/ready-list")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch custom order ready status" })
  @ApiParam({ name: "orderId", example: 2440968, type: Number })
  @ApiResponse({ status: 200, description: "Custom order ready list" })
  async get_get_super_user_custom_order_orderId_ready_list(@Param("orderId") orderId: string) {
    try {
      const rows = await this.db
        .select()
        .from(schema.customOrderReady)
        .where(eq(schema.customOrderReady.customOrderId, Number(orderId)));
      return keyedResponse("data", rows || []);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/super-user/ads-conversion/summary")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Ads conversion performance summary" })
  @ApiResponse({ status: 200, description: "Ads conversion summary metrics" })
  async get_get_super_user_ads_conversion_summary(@Query() query: any) {
    try {
      const orders = await this.db
        .select()
        .from(schema.orders)
        .limit(200);

      const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(String(o.total || "0")), 0);
      const utmOrders = orders.filter(o => o.utmSource || o.clickId);
      const googleAds = orders.filter(o => o.utmSource?.toLowerCase().includes("google") || o.utmMedium?.toLowerCase().includes("cpc"));
      const facebookAds = orders.filter(o => o.utmSource?.toLowerCase().includes("facebook") || o.utmSource?.toLowerCase().includes("fb"));

      return keyedResponse("data", [{
        totalOrders: orders.length,
        totalRevenue: Math.round(totalRevenue),
        utmAttributedOrders: utmOrders.length,
        googleAdsConversions: googleAds.length,
        facebookAdsConversions: facebookAds.length,
        conversionRatePercent: orders.length > 0 ? ((utmOrders.length / orders.length) * 100).toFixed(2) : "0.00",
      }]);
    } catch (err) {
      return keyedResponse("data", [{
        totalOrders: 0,
        totalRevenue: 0,
        utmAttributedOrders: 0,
        googleAdsConversions: 0,
        facebookAdsConversions: 0,
        conversionRatePercent: "0.00",
      }]);
    }
  }

  @Get("/get/super-user/ads-conversion/orders")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Orders attributed to ads & marketing campaigns" })
  @ApiResponse({ status: 200, description: "List of attributed orders" })
  async get_get_super_user_ads_conversion_orders(@Query() query: any) {
    try {
      const rows = await this.db
        .select()
        .from(schema.orders)
        .where(or(sql`${schema.orders.utmSource} IS NOT NULL`, sql`${schema.orders.clickId} IS NOT NULL`))
        .orderBy(desc(schema.orders.id))
        .limit(50);
      const formatted = (rows || []).map(formatOrderRow);
      return keyedResponse("data", formatted);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/super-user/ads-conversion/abandoned-carts")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Abandoned cart analysis" })
  @ApiResponse({ status: 200, description: "List of abandoned carts" })
  async get_get_super_user_ads_conversion_abandoned_carts(@Query() query: any) {
    try {
      const rows = await this.db
        .select()
        .from(schema.cartItem)
        .orderBy(desc(schema.cartItem.id))
        .limit(50);
      const formatted = (rows || []).map(r => ({
        id: r.id ? String(r.id) : null,
        tenantId: r.tenantId ? String(r.tenantId) : null,
        productId: String(r.finishedProductId ?? r.fabricProductId ?? ""),
        quantity: r.quantity ? Number(r.quantity) : 1,
        timeOfCreation: r.lastUpdatedAt ?? null,
      }));
      return keyedResponse("data", formatted);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/super-user/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect SuperUser entity by ID" })
  @ApiParam({ name: "id", example: 1, type: Number })
  async get_get_table_explorer_data_super_user_id(@Param("id") id: string) {
    try {
      const result = await this.db
        .select()
        .from(schema.superUser)
        .where(eq(schema.superUser.id, BigInt(id)));
      return keyedResponse("data", (result || []).map(formatSuperUser));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/super-user")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for SuperUser" })
  async get_get_table_explorer_data_super_user(@Query() query: any) {
    try {
      const result = await this.db
        .select()
        .from(schema.superUser)
        .orderBy(desc(schema.superUser.id))
        .limit(50);
      return keyedResponse("data", (result || []).map(formatSuperUser));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }
}
