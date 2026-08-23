import * as schema from "../../database/schema/schema.js";
import { eq } from "drizzle-orm";
// @ts-nocheck
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, HttpCode, Inject, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";

@ApiTags("Address")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class AddressMigratedDomainController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}
  @Get("/get/table-explorer/data/address/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Migrated Java LOOM endpoint GET /get/table-explorer/data/address/:id" })
  async get_get_table_explorer_data_address_id(@Param('id') id: string) {
    try {
      // Query real PostgreSQL database table via Drizzle ORM
      const result = await (this.db as any).select().from(schema.address).limit(50);
      return keyedResponse("data", result || []);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/address")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Migrated Java LOOM endpoint GET /get/table-explorer/data/address" })
  async get_get_table_explorer_data_address(@Query() query: any) {
    try {
      // Query real PostgreSQL database table via Drizzle ORM
      const result = await (this.db as any).select().from(schema.address).limit(50);
      return keyedResponse("data", result || []);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

}
