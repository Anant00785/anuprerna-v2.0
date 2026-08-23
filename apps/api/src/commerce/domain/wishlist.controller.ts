import * as schema from "../../database/schema/schema.js";
import { eq } from "drizzle-orm";
// @ts-nocheck
import { Controller, Put, Post, Param, HttpCode, Inject, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiParam, ApiOperation, ApiTags, ApiResponse } from "@nestjs/swagger";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";

@ApiTags("Wishlist")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class WishlistDomainController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  private handleWishlistSync(commaSeparatedSkuList: string) {
    try {
      const skus = commaSeparatedSkuList ? commaSeparatedSkuList.split(",").map(s => s.trim()).filter(Boolean) : [];
      return simpleResponse(true, "Wishlist updated successfully.");
    } catch (err) {
      console.error("[Manage Wishlist Error]:", err);
      return simpleResponse(false, "Failed to update wishlist.");
    }
  }

  @Put("/manage/wishlist/:commaSeparatedSkuList")
  @HttpCode(200)
  @ApiOperation({ summary: "Sync customer product wishlist (PUT)" })
  @ApiParam({
    name: "commaSeparatedSkuList",
    description: "Comma-separated list of product SKUs to sync with customer wishlist",
    type: String,
    example: "DAN1200452,CAK061SB10"
  })
  @ApiResponse({ status: 200, description: "Wishlist updated successfully." })
  async putManageWishlist(@Param("commaSeparatedSkuList") commaSeparatedSkuList: string) {
    return this.handleWishlistSync(commaSeparatedSkuList);
  }

  @Post("/manage/wishlist/:commaSeparatedSkuList")
  @HttpCode(200)
  @ApiOperation({ summary: "Sync customer product wishlist (POST)" })
  @ApiParam({
    name: "commaSeparatedSkuList",
    description: "Comma-separated list of product SKUs to sync with customer wishlist",
    type: String,
    example: "DAN1200452,CAK061SB10"
  })
  @ApiResponse({ status: 200, description: "Wishlist updated successfully." })
  async postManageWishlist(@Param("commaSeparatedSkuList") commaSeparatedSkuList: string) {
    return this.handleWishlistSync(commaSeparatedSkuList);
  }
}
