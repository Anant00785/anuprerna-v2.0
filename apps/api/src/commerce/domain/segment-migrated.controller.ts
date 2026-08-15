import * as schema from "../../database/schema/schema.js";
import { eq } from "drizzle-orm";
// @ts-nocheck
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, HttpCode, Inject, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";

@ApiTags("Segment")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class SegmentMigratedDomainController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  @ApiOperation({ summary: "Market segment filtering dropdown data" })
  async get_get_filter_segment_list(@Query() query: any) {
    try {
      // Query real PostgreSQL database table via Drizzle ORM
      const result = await (this.db as any).select().from(schema.product).limit(50);
      return keyedResponse("data", result || []);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/segment-list")
  @ApiOperation({ summary: "Fetch product segments" })
  async get_get_segment_list(@Query() query: any) {
    try {
      // Query real PostgreSQL database table via Drizzle ORM
      const result = await (this.db as any).select().from(schema.segment).limit(50);
      return keyedResponse("data", result || []);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }
}
