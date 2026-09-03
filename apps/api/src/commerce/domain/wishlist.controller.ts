/**
 * apps/api/src/commerce/domain/wishlist.controller.ts
 *
 * Java original: tenant/controller/CustomerController.manageWishlist
 *   @PutMapping(RequestMapper.MANAGE_WISHLIST) -> CODE_CU
 *   -> WishlistSkuCSVValidator (StringValidator.validate(csv, 0, 9999):
 *      rejects empty, rejects longer than 9999)
 *   -> CustomerDAOController.manageWishlist(tenantFromToken, csv), which sets
 *      customer.wishlist = csv and saves.
 *
 * This handler used to parse the SKUs, write NOTHING, and answer
 * "Wishlist updated successfully." A write path that reports success for work
 * it did not do is the same defect class as an invented price or an invented
 * delivery estimate.
 */
import { Controller, Put, Post, Param, HttpCode, UseGuards, BadRequestException } from "@nestjs/common";
import { ApiBearerAuth, ApiParam, ApiOperation, ApiTags, ApiResponse } from "@nestjs/swagger";
import { simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";
import type { AuthenticatedTenant } from "../../auth/types/auth.types.js";
import { CurrentTenant } from "../../common/auth/current-tenant.decorator.js";
import { CustomerDomainService } from "./customer-domain.service.js";

/** Loom: WishlistSkuCSVValidator -> StringValidator.validate(entity, 0, 9999). */
const MAX_WISHLIST_CSV_LENGTH = 9999;

@ApiTags("Wishlist")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class WishlistDomainController {
  constructor(private readonly customers: CustomerDomainService) {}

  private async handleWishlistSync(commaSeparatedSkuList: string, tenant: AuthenticatedTenant) {
    // Loom's validator rejects an empty string outright — there is no
    // "clear my wishlist" via this route.
    const csv = (commaSeparatedSkuList ?? "").trim();
    if (csv.length === 0) throw new BadRequestException("Wishlist SKU list is required.");
    if (csv.length > MAX_WISHLIST_CSV_LENGTH) {
      throw new BadRequestException(`Wishlist SKU list exceeds ${MAX_WISHLIST_CSV_LENGTH} characters.`);
    }

    // Loom stores the CSV verbatim in customer.wishlist; normalise only the
    // separator whitespace so the column does not accumulate " A , B ".
    const normalised = csv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .join(",");
    if (normalised.length === 0) throw new BadRequestException("Wishlist SKU list is required.");

    // Scoped to @CurrentTenant() — the route carries no customer id, so one
    // customer can never write another's wishlist.
    const written = await this.customers.replaceWishlist(tenant.id, normalised);

    // Loom: ActionCode.NO_ACTION when the tenant has no customer row. Report
    // the failure rather than claiming a write that did not happen.
    if (!written) return simpleResponse(false, "Failed to update wishlist.");
    return simpleResponse(true, "Wishlist updated successfully.");
  }

  @Put("/manage/wishlist/:commaSeparatedSkuList")
  @HttpCode(200)
  @ApiOperation({ summary: "Replace the calling customer's product wishlist (PUT)" })
  @ApiParam({
    name: "commaSeparatedSkuList",
    description: "Complete comma-separated list of product SKUs — replaces the stored wishlist",
    type: String,
    example: "DAN1200452,CAK061SB10",
  })
  @ApiResponse({ status: 200, description: "Wishlist updated successfully." })
  @RequireGate(GateCode.CODE_CU)
  async putManageWishlist(
    @Param("commaSeparatedSkuList") commaSeparatedSkuList: string,
    @CurrentTenant() tenant: AuthenticatedTenant,
  ) {
    return this.handleWishlistSync(commaSeparatedSkuList, tenant);
  }

  // Loom maps only @PutMapping here; the POST alias is this port's own and is
  // kept pointing at the identical replace so the two cannot diverge.
  @Post("/manage/wishlist/:commaSeparatedSkuList")
  @HttpCode(200)
  @ApiOperation({ summary: "Replace the calling customer's product wishlist (POST alias)" })
  @ApiParam({
    name: "commaSeparatedSkuList",
    description: "Complete comma-separated list of product SKUs — replaces the stored wishlist",
    type: String,
    example: "DAN1200452,CAK061SB10",
  })
  @ApiResponse({ status: 200, description: "Wishlist updated successfully." })
  @RequireGate(GateCode.CODE_CU)
  async postManageWishlist(
    @Param("commaSeparatedSkuList") commaSeparatedSkuList: string,
    @CurrentTenant() tenant: AuthenticatedTenant,
  ) {
    return this.handleWishlistSync(commaSeparatedSkuList, tenant);
  }
}
