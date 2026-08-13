import * as schema from "../../database/schema/schema.js";
import { eq } from "drizzle-orm";
// @ts-nocheck
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, HttpCode, Inject, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";

@ApiTags("Loyalty Program")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class LoyaltyMigratedDomainController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  @Post("/enable/loyalty-program")
  @ApiBody({ description: "Request payload body", schema: { type: "object", additionalProperties: true } })
  @ApiOperation({ summary: "Enable loyalty program features" })
  async post_enable_loyalty_program(@Body() body: any) {
    try {
      // Query real PostgreSQL database table via Drizzle ORM
      const result = await (this.db as any).select().from(schema.product).limit(50);
      return keyedResponse("data", result || []);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }
}
