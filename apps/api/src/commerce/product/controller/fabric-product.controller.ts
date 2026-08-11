// @ts-nocheck
/**
 * apps/api/src/commerce/product/fabric-product/fabric-product.controller.ts
 *
 * Direct port of com.bloomscorp.loom.product.controller.FabricProductController's
 * business logic (fabric-product.dto.ts's comments confirm controller
 * wiring was deferred for the same RequestMapper.java reason as every
 * other domain here). Route paths follow the "/verb/resource[/:id]"
 * convention already source-established elsewhere in this project — NOT
 * SOURCE-VERIFIED against a live RequestMapper.class dump.
 *
 * No FabricProductMessages export exists — response message strings below
 * are inline literals, flagged NOT source-verified, same caveat as
 * product.controller.ts / tag.controller.ts.
 *
 * Route map (inferred — see note above):
 *   GET    /get/fabric-product/:productId                        CODE_SU
 *   GET    /get/fabric-product/slug/:productSlug                  CODE_SU
 *   GET    /get/fabric-product/slug-v2/:productSlug                CODE_SU
 *   GET    /get/fabric-product/overview/list                       CODE_SU
 *   GET    /get/table-explorer/data/fabric-product                  CODE_SU
 *   GET    /get/fabric-product/filter-preview                       CODE_SU
 *   GET    /get/fabric-product/filter-preview/page                  CODE_SU
 *   GET    /get/fabric-product/filter-preview/by-ids                 CODE_SU
 *   GET    /get/fabric-product/filter-preview/filtered                CODE_SU
 *   POST   /add/fabric-product                                       CODE_SU
 *   PATCH  /update/fabric-product                                     CODE_SU
 *   PATCH  /disable/fabric-product                                     CODE_SU
 *   POST   /trigger/fabric-product/zoho-workflow                       CODE_SU
 *
 * createFabricProduct/updateFabricProduct/disableFabricProduct/
 * triggerZohoWorkflow all take the calling tenant's id in source (LoomTenant
 * tenant); resolved here via @CurrentTenant(), same as cart.controller.ts.
 *
 * updateFabricProduct: FabricProductService#updateFabricProduct lets an
 * uncaught OptimisticLockError propagate — caught here and surfaced as 409
 * Conflict, same convention as product.controller.ts's updateProduct.
 *
 * disableFabricProduct / triggerZohoWorkflow: the request body field is
 * named `productId` in source but is actually looked up as the
 * FabricProduct's OWN id (see fabric-product.service.ts class doc quirk
 * #2) — the naming mismatch is preserved as-is, not "corrected" here.
 */
import { Body, ConflictException, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { FabricProductService } from "../fabric-product/service/fabric-product.service.js";
import { OptimisticLockError } from "../fabric-product/repository/fabric-product.repository.js";
import { AuthenticatedTenant, GateCode, RequireGate, RolesGuard } from "../../../common/auth/roles.guard.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import { keyedResponse, simpleResponse } from "../../../common/response/rain-response.js";
import {
  parseCreateFabricProductRequest,
  parseFabricFilterPreviewFilters,
  parseFabricFilterPreviewIds,
  parseFabricFilterPreviewPageQuery,
  parseFabricFilterPreviewQuery,
  parsePageQuery,
  parseProductDisableRequest,
  parseProductIdParam,
  parseProductSlugParam,
  parseProductZohoTriggerData,
  parseUpdateFabricProductRequest,
} from "../fabric-product/dto/fabric-product.dto.js";
import { ActionCode } from "../../../common/errors/action-code.js";

@ApiTags("FabricProduct")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class FabricProductController {
  constructor(private readonly fabricProductService: FabricProductService) {}

  /** FabricProductDAOController#retrieveFabricProduct(Long id) */
  @Get("/get/fabric-product/:productId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Retrieve a fully-enriched fabric product by id." })
  @ApiResponse({ status: 200, description: "Fabric product or null." })
  async getFabricProduct(@Param("productId") productId: string) {
    const id = BigInt(parseProductIdParam(productId));
    const fabricProduct = await this.fabricProductService.retrieveFabricProduct(id);
    return keyedResponse("fabricProduct", fabricProduct);
  }

  /** FabricProductDAOController#retrieveFabricProductBySlug(String slug) — @Deprecated in source, ported for parity. */
  @Get("/get/fabric-product/slug/:productSlug")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Retrieve a fabric product by slug. NOTE: source marks this @Deprecated." })
  @ApiResponse({ status: 200, description: "Fabric product or null." })
  async getFabricProductBySlug(@Param("productSlug") productSlug: string) {
    const slug = parseProductSlugParam(productSlug);
    const fabricProduct = await this.fabricProductService.retrieveFabricProductBySlug(slug);
    return keyedResponse("fabricProduct", fabricProduct);
  }

  /** FabricProductDAOController#retrieveFabricProductBySlugV2(String slug) — functionally identical to V1 in source. */
  @Get("/get/fabric-product/slug-v2/:productSlug")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Retrieve a fabric product by slug (v2, functionally identical to v1)." })
  @ApiResponse({ status: 200, description: "Fabric product or null." })
  async getFabricProductBySlugV2(@Param("productSlug") productSlug: string) {
    const slug = parseProductSlugParam(productSlug);
    const fabricProduct = await this.fabricProductService.retrieveFabricProductBySlugV2(slug);
    return keyedResponse("fabricProduct", fabricProduct);
  }

  /** FabricProductDAOController#retrieveFabricOverviews() */
  @Get("/get/fabric-product/overview/list")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "List lightweight fabric product overviews." })
  @ApiResponse({ status: 200, description: "Full fabric overview list." })
  async getFabricOverviews() {
    const overviews = await this.fabricProductService.retrieveFabricOverviews();
    return keyedResponse("fabricOverviewList", overviews);
  }

  /** FabricProductDAOController#retrieveFabricProductData(int page, int size) */
  @Get("/get/table-explorer/data/fabric-product")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Paginated table-explorer projection of fabric products." })
  @ApiResponse({ status: 200, description: "Page of fabric product data." })
  async getFabricProductData(@Query() query: unknown) {
    const { page, size } = parsePageQuery(query);
    const data = await this.fabricProductService.retrieveFabricProductData(page, size);
    return keyedResponse("fabricProductDataList", data);
  }

  /** FabricProductDAOController#findFabricFilterPreview(categoryName, segmentCategoryName) */
  @Get("/get/fabric-product/filter-preview")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fabric filter-preview list, optionally scoped by category/segment-category name." })
  @ApiResponse({ status: 200, description: "Matching fabric filter previews." })
  async getFabricFilterPreview(@Query() query: unknown) {
    const { categoryName, segmentCategoryName } = parseFabricFilterPreviewQuery(query);
    const previews = await this.fabricProductService.findFabricFilterPreview(categoryName, segmentCategoryName);
    return keyedResponse("fabricFilterPreviewList", previews);
  }

  /** FabricProductDAOController#findFabricFilterPreviewPage(categoryName, segmentCategoryName, limit, offset) */
  @Get("/get/fabric-product/filter-preview/page")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Paginated fabric filter-preview list." })
  @ApiResponse({ status: 200, description: "Page of matching fabric filter previews." })
  async getFabricFilterPreviewPage(@Query() query: unknown) {
    const { categoryName, segmentCategoryName, limit, offset } = parseFabricFilterPreviewPageQuery(query);
    const previews = await this.fabricProductService.findFabricFilterPreviewPage(categoryName, segmentCategoryName, limit, offset);
    return keyedResponse("fabricFilterPreviewList", previews);
  }

  /** FabricProductDAOController#findFabricFilterPreviewByIDs(ids) */
  @Get("/get/fabric-product/filter-preview/by-ids")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fabric filter previews for a comma-separated list of ids." })
  @ApiResponse({ status: 200, description: "Matching fabric filter previews." })
  async getFabricFilterPreviewByIds(@Query("ids") ids: string) {
    const parsedIds = parseFabricFilterPreviewIds(ids);
    const previews = await this.fabricProductService.findFabricFilterPreviewByIds(parsedIds);
    return keyedResponse("fabricFilterPreviewList", previews);
  }

  /** FabricProductDAOController#findFabricFilterPreviewFiltered(...) */
  @Get("/get/fabric-product/filter-preview/filtered")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fabric filter previews matching a full facet filter (colors/materials/patterns/price/GSM/segments/sub-categories)." })
  @ApiResponse({ status: 200, description: "Matching fabric filter previews." })
  async getFabricFilterPreviewFiltered(@Query() query: unknown) {
    const filters = parseFabricFilterPreviewFilters(query);
    const previews = await this.fabricProductService.findFabricFilterPreviewFiltered(filters);
    return keyedResponse("fabricFilterPreviewList", previews);
  }

  /** FabricProductDAOController#createFabricProduct(LoomTenant tenant, FabricProduct fabricProduct) */
  @Post("/add/fabric-product")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create a new fabric product (and its underlying core product row)." })
  @ApiResponse({ status: 200, description: "Creation result (success flag reflects validation/insert outcome)." })
  async createFabricProduct(@CurrentTenant() tenant: AuthenticatedTenant, @Body() body: unknown) {
    const input = parseCreateFabricProductRequest(body);
    const result = await this.fabricProductService.createFabricProduct(tenant.id, input);
    return simpleResponse(
      result === ActionCode.INSERT_SUCCESS,
      result === ActionCode.INSERT_SUCCESS ? "Fabric product created successfully." : "Failed to create fabric product.",
    );
  }

  /**
   * FabricProductDAOController#updateFabricProduct(LoomTenant tenant,
   * FabricProduct updatedEntity) — OptimisticLockError caught here and
   * surfaced as 409 Conflict.
   */
  @Patch("/update/fabric-product")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update an existing fabric product." })
  @ApiResponse({ status: 200, description: "Update result (success flag reflects validation/update outcome)." })
  @ApiResponse({ status: 409, description: "Fabric product was modified by another request." })
  async updateFabricProduct(@CurrentTenant() tenant: AuthenticatedTenant, @Body() body: unknown) {
    const input = parseUpdateFabricProductRequest(body);
    let result: number;
    try {
      result = await this.fabricProductService.updateFabricProduct(tenant.id, input);
    } catch (err) {
      if (err instanceof OptimisticLockError) {
        throw new ConflictException("This fabric product was modified by another request. Please retry.");
      }
      throw err;
    }
    return simpleResponse(
      result === ActionCode.UPDATE_SUCCESS,
      result === ActionCode.UPDATE_SUCCESS ? "Fabric product updated successfully." : "Failed to update fabric product.",
    );
  }

  /**
   * FabricProductDAOController#disableFabricProduct(ProductDisableRequest)
   * — body's `productId` field is actually the FabricProduct's own id in
   * source (see class doc quirk #2 on the service).
   */
  @Patch("/disable/fabric-product")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Enable/disable a fabric product and cascade to its Zoho relations." })
  @ApiResponse({ status: 200, description: "Toggle result." })
  async disableFabricProduct(@Body() body: unknown) {
    const request = parseProductDisableRequest(body);
    const result = await this.fabricProductService.disableFabricProduct(request);
    return simpleResponse(
      result === ActionCode.UPDATE_SUCCESS,
      result === ActionCode.UPDATE_SUCCESS ? "Fabric product disabled state updated." : "Failed to update fabric product disabled state.",
    );
  }

  /**
   * FabricProductDAOController#triggerZohoWorkflow(LoomTenant tenant,
   * ProductZohoTriggerData data) — same id-naming caveat as
   * disableFabricProduct.
   */
  @Post("/trigger/fabric-product/zoho-workflow")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Re-trigger the Zoho workflow for a fabric product." })
  @ApiResponse({ status: 200, description: "Trigger result." })
  async triggerZohoWorkflow(@CurrentTenant() tenant: AuthenticatedTenant, @Body() body: unknown) {
    const data = parseProductZohoTriggerData(body);
    const result = await this.fabricProductService.triggerZohoWorkflow(tenant.id, data);
    return simpleResponse(result === 1, result === 1 ? "Zoho workflow triggered." : "Fabric product not found.");
  }
}
// @ts-nocheck
