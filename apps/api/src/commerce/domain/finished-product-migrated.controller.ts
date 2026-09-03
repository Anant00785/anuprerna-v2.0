import * as schema from "../../database/schema/schema.js";
import { eq } from "drizzle-orm";
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, HttpCode, Inject, UseGuards, NotImplementedException } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";

@ApiTags("FinishedProduct")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class FinishedProductMigratedDomainController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  @ApiOperation({ summary: "Preview list of finished goods" })
  async get_get_finished_preview_list(@Query() query: any) {
    // Query real PostgreSQL database table via Drizzle ORM
    const result = await (this.db as any).select().from(schema.product).limit(50);
    return keyedResponse("data", result || []);

  }

  @Delete("/delete/finished-product/:productId")
  @ApiOperation({ summary: "Delete finished product entry" })
  @RequireGate(GateCode.CODE_SU)
  async delete_delete_finished_product_productId(@Param("productId") productId: string) {
    // RequestMapper.DELETE_FINISHED_PRODUCT is declared in Loom but has no
    // handler mapped to it in the Java source, so the delete semantics (hard
    // delete? disable? cascade to product_finished?) cannot be determined.
    // It was answering 200 with an arbitrary product dump while deleting
    // nothing — a destructive endpoint that silently no-ops is worse than one
    // that refuses.
    throw new NotImplementedException(
      `Finished-product deletion is not implemented (product ${productId}).`,
    );
  }
}
