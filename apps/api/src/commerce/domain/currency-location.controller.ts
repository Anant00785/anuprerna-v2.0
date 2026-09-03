import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Req,
  Inject,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import * as schema from "../../database/schema/schema.js";
import { eq, desc } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { IPLocationService } from "../iplocation/service/iplocation.service.js";
import { CreateForexDto, UpdateForexDto } from "../forex/controller/forex.controller.js";

@ApiTags("Currency & Location")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class CurrencyLocationDomainController {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly ipLocationService: IPLocationService,
  ) {}

  @Get("/get/ip-wise/currency")
  @ApiOperation({ summary: "Geolocation dynamic currency converter" })
  @ApiResponse({ status: 200, description: "IP-wise currency details" })
  async get_get_ip_wise_currency(@Req() req: any, @Query() query: any) {
    try {
      let ip = query?.ip || req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress || "127.0.0.1";
      if (Array.isArray(ip)) ip = ip[0];
      const data = await this.ipLocationService.getCurrencyCountryFromIPAddress(ip);
      return keyedResponse("currency", data);
    } catch (err) {
      return keyedResponse("currency", { country: "India", continent: "Asia", currency: "inr" });
    }
  }

  @Get(["/get/forex/list", "/get/forex-list"])
  @ApiOperation({ summary: "List supported forex currencies" })
  @ApiResponse({ status: 200, description: "List of supported currencies" })
  // PUBLIC — no @RequireGate. This is a DUPLICATE registration of the same two
  // paths ForexController serves; that controller was un-gated earlier for the
  // outage this one still carried. Loom's ForexController.getForexList() calls
  // response.buildList() directly (never getEntity/CODE_*), and the storefront
  // fetches /get/forex-list during SSR with no bearer token
  // (apps/storefront/src/lib/loom/endpoints.ts getForexList).
  async get_get_forex_list(@Query() query: any) {
    try {
      const result = await this.db
        .select()
        .from(schema.forex)
        .orderBy(desc(schema.forex.id));
      const formatted = (result || []).map(row => ({
        id: String(row.id),
        version: Number(row.version),
        country: row.country,
        currency: row.currency,
        rate: row.rate ? parseFloat(String(row.rate)) : null,
      }));
      return {
        success: true,
        message: "",
        data: formatted,
        forexList: formatted,
      };
    } catch (err) {
      return { success: true, message: "", data: [], forexList: [] };
    }
  }

  @Get("/get/forex/:forexId")
  @ApiOperation({ summary: "Retrieve forex currency by ID" })
  @ApiParam({ name: "forexId", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Forex details" })
  @RequireGate(GateCode.CODE_SU)
  async get_get_forex_forexId(@Param("forexId") forexId: string) {
    if (forexId === "list") {
      return this.get_get_forex_list({});
    }
    const [row] = await this.db
      .select()
      .from(schema.forex)
      .where(eq(schema.forex.id, BigInt(forexId)));
    return keyedResponse("data", row ? [{
      id: String(row.id),
      version: Number(row.version),
      country: row.country,
      currency: row.currency,
      rate: row.rate ? parseFloat(String(row.rate)) : null,
    }] : []);
  }

  @Post("/add/forex")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Register new forex currency" })
  @ApiBody({ type: CreateForexDto })
  @ApiResponse({ status: 201, description: "Forex currency created" })
  async post_add_forex(@Body() body: CreateForexDto) {
    const [inserted] = await this.db
      .insert(schema.forex)
      .values({
        country: body.country,
        currency: body.currency,
        rate: String(body.rate),
      })
      .returning();
    return keyedResponse("data", inserted ? [inserted] : []);
  }

  @Patch("/update/forex")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update forex currency parameters" })
  @ApiBody({ type: UpdateForexDto })
  @ApiResponse({ status: 200, description: "Forex currency updated" })
  async patch_update_forex(@Body() body: UpdateForexDto) {
    const updateData: any = {};
    if (body.country) updateData.country = body.country;
    if (body.currency) updateData.currency = body.currency;
    if (body.rate !== undefined) updateData.rate = String(body.rate);

    const [updated] = await this.db
      .update(schema.forex)
      .set(updateData)
      .where(eq(schema.forex.id, BigInt(body.forexId)))
      .returning();
    return keyedResponse("data", updated ? [updated] : []);
  }

  @Delete("/delete/forex/:forexId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Remove forex currency" })
  @ApiParam({ name: "forexId", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Forex currency deleted" })
  async delete_delete_forex_forexId(@Param("forexId") forexId: string) {
    try {
      await this.db
        .delete(schema.forex)
        .where(eq(schema.forex.id, BigInt(forexId)));
      return simpleResponse(true, "Forex currency deleted successfully.");
    } catch (err) {
      return simpleResponse(false, "Failed to delete forex currency.");
    }
  }

  @Get("/get/table-explorer/data/forex/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect Forex entity by ID" })
  @ApiParam({ name: "id", example: 1, type: Number })
  async get_get_table_explorer_data_forex_id(@Param("id") id: string) {
    const result = await this.db
      .select()
      .from(schema.forex)
      .where(eq(schema.forex.id, BigInt(id)));
    return keyedResponse("data", result || []);
  }

  @Get("/get/table-explorer/data/forex-exchange-rate/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect ForexExchangeRate entity by ID" })
  @ApiParam({ name: "id", example: 1, type: Number })
  async get_get_table_explorer_data_forex_exchange_rate_id(@Param("id") id: string) {
    const result = await this.db
      .select()
      .from(schema.forexExchangeRate)
      .where(eq(schema.forexExchangeRate.id, BigInt(id)));
    return keyedResponse("data", result || []);
  }

  @Get("/get/table-explorer/data/forex-exchange-rate")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for ForexExchangeRate" })
  async get_get_table_explorer_data_forex_exchange_rate(@Query() query: any) {
    const result = await this.db
      .select()
      .from(schema.forexExchangeRate)
      .limit(50);
    return keyedResponse("data", result || []);
  }

  @Get("/get/table-explorer/data/forex")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for Forex" })
  async get_get_table_explorer_data_forex(@Query() query: any) {
    const result = await this.db
      .select()
      .from(schema.forex)
      .limit(50);
    return keyedResponse("data", result || []);
  }
}
