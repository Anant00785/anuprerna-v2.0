import * as schema from "../../database/schema/schema.js";
import { eq } from "drizzle-orm";
import { BadRequestException, Controller, Get, Post, Patch, Delete, Param, Query, Body, HttpCode, Inject, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { CurrentTenant } from "../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../auth/types/auth.types.js";
import { CustomerDomainService } from "./customer-domain.service.js";

@ApiTags("Customer")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class CustomerDomainController {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly customers: CustomerDomainService,
  ) {}

  @Get("/get/customers")
  @ApiOperation({ summary: "Admin retrieval of customer directory" })
  @RequireGate(GateCode.CODE_SU)
  async get_get_customers(@Query() query: any) {
    // Query real PostgreSQL database table via Drizzle ORM
    const result = await (this.db as any).select().from(schema.product).limit(50);
    return keyedResponse("data", result || []);

  }

  @Get("/get/loyalty-eligible/customers")
  @ApiOperation({ summary: "Get customers eligible for loyalty program" })
  @RequireGate(GateCode.CODE_SU)
  async get_get_loyalty_eligible_customers(@Query() query: any) {
    // Query real PostgreSQL database table via Drizzle ORM
    const result = await (this.db as any).select().from(schema.product).limit(50);
    return keyedResponse("data", result || []);

  }

  @Get("/get/loyalty-program/customers/metrics")
  @ApiOperation({ summary: "Retrieve loyalty program customer metrics" })
  @RequireGate(GateCode.CODE_SU)
  async get_get_loyalty_program_customers_metrics(@Query() query: any) {
    // Query real PostgreSQL database table via Drizzle ORM
    const result = await (this.db as any).select().from(schema.product).limit(50);
    return keyedResponse("data", result || []);

  }

  @Get("/get/customer/loyalty/info")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Retrieve customer loyalty membership data" })
  async get_get_customer_loyalty_info(@CurrentTenant() tenant: AuthenticatedTenant) {
    // IDOR FIX. Loom: LoyaltyProgramConfigController
    // .getCustomerLoyaltyProgramMembershipInfo resolves the customer FROM THE
    // TOKEN and returns exactly that customer's membership row, keyed
    // ResponseParameter.LOYALTY_PROGRAM_INFO. This was returning
    // `SELECT * FROM customer LIMIT 50` to ANY authenticated customer —
    // 50 other people's customer rows (WhatsApp numbers, preferences, wishlist).
    return keyedResponse("loyaltyProgramInfo", await this.customers.getLoyaltyMembershipInfo(tenant.id));
  }

  @Get("/get/data-dump/customer")
  @ApiOperation({ summary: "Export JSON data dump of customer directory" })
  @RequireGate(GateCode.CODE_SU)
  async get_get_data_dump_customer(@Query() query: any) {
    const result = await (this.db as any).select().from(schema.customer);
    return keyedResponse("data", result || []);

  }

  // Loom CustomerController.getCustomerData → getEntity(..., CODE_SU,
  // UNAUTH_TABLE_EXPLORER_CUSTOMER_REQUEST) over the `retrieveCustomer` native
  // query: the CustomerData projection (id, version, tenant_id, wishlist,
  // default_currency, whatsapp_*) ORDER BY id LIMIT :size OFFSET :page*:size,
  // keyed ResponseParameter.CUSTOMER_LIST = "customerList". page and size are
  // required @RequestParam ints in Loom, so a missing/non-numeric value is 400.
  @Get("/get/table-explorer/data/customer")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table-explorer customer projection, paginated" })
  async get_get_table_explorer_data_customer(@Query("page") page?: string, @Query("size") size?: string) {
    const pageNum = Number(page);
    const sizeNum = Number(size);
    if (!Number.isInteger(pageNum) || !Number.isInteger(sizeNum) || pageNum < 0 || sizeNum < 1) {
      throw new BadRequestException("page and size are required integer query parameters");
    }
    const rows = await this.db
      .select({
        id: schema.customer.id,
        version: schema.customer.version,
        tenantId: schema.customer.tenantId,
        wishlist: schema.customer.wishlist,
        defaultCurrency: schema.customer.defaultCurrency,
        whatsappNumber: schema.customer.whatsappNumber,
        whatsappOptInStatus: schema.customer.whatsappOptInStatus,
        whatsappConsentExpiresAt: schema.customer.whatsappConsentExpiresAt,
        whatsappPromptAt: schema.customer.whatsappPromptAt,
        whatsappDismissCount: schema.customer.whatsappDismissCount,
        whatsappPreferences: schema.customer.whatsappPreferences,
      })
      .from(schema.customer)
      .orderBy(schema.customer.id)
      .limit(sizeNum)
      .offset(pageNum * sizeNum);
    // Loom selects whatsapp_preferences::text — a JSON string, not an object.
    const customerList = rows.map((row) => ({
      ...row,
      whatsappPreferences: row.whatsappPreferences == null ? null : JSON.stringify(row.whatsappPreferences),
    }));
    return keyedResponse("customerList", customerList);
  }

  @Get("/get/table-explorer/data/customer/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect Customer entity by ID" })
  async get_get_table_explorer_data_customer_id(@Param("id") id: string) {
    const rows = await this.db
      .select()
      .from(schema.customer)
      .where(eq(schema.customer.id, BigInt(id)))
      .limit(1);
    return keyedResponse("data", rows[0] ?? null);
  }

}
