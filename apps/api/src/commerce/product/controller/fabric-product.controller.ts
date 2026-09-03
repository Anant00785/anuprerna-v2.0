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
import { Body, ConflictException, Controller, Get, NotFoundException, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { FabricProductService } from "../fabric-product/service/fabric-product.service.js";
import { OptimisticLockError } from "../fabric-product/repository/fabric-product.repository.js";
import { AuthenticatedTenant, GateCode, RequireGate, RolesGuard } from "../../../common/auth/roles.guard.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import { keyedResponse, simpleResponse } from "../../../common/response/rain-response.js";
import {
  CreateFabricProductDto,
  DisableProductDto,
  UpdateFabricProductDto,
  ZohoTriggerDto,
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

  /**
   * `/get/fabric-product/slug/` (empty slug) otherwise falls through to
   * `/get/fabric-product/:productId` with productId="slug" and answers
   * 400 "productId must be an integer". Declared before the `:productId`
   * route because Express matches in registration order.
   */
  @Get("/get/fabric-product/slug")
  @ApiOperation({ summary: "Reserved — an empty slug is a 404, not a product id." })
  @ApiResponse({ status: 404, description: "No slug supplied." })
  emptySlug(): never {
    throw new NotFoundException("A product slug is required.");
  }

  /** FabricProductDAOController#retrieveFabricProduct(Long id) */
  @Get("/get/fabric-product/:productId")
  @ApiOperation({ summary: "Retrieve a fully-enriched fabric product by id." })
  @ApiResponse({ status: 200, description: "Fabric product." })
  @ApiResponse({ status: 400, description: "Malformed product id." })
  @ApiResponse({ status: 404, description: "No such fabric product." })
  async getFabricProduct(@Param("productId") productId: string) {
    const id = BigInt(parseProductIdParam(productId));
    const fabricProduct = await this.fabricProductService.retrieveFabricProduct(id);
    if (!fabricProduct) throw new NotFoundException(`Fabric product ${productId} not found.`);
    return keyedResponse("fabricProduct", fabricProduct);
  }

  /** FabricProductDAOController#retrieveFabricProductBySlug(String slug) — @Deprecated in source, ported for parity. */
  @Get("/get/fabric-product/slug/:productSlug")
  @ApiOperation({ summary: "Retrieve a fabric product by slug." })
  @ApiResponse({ status: 200, description: "Fabric product." })
  @ApiResponse({ status: 404, description: "No product with that slug." })
  async getFabricProductBySlug(@Param("productSlug") productSlug: string) {
    const slug = parseProductSlugParam(productSlug);
    const fabricProduct = await this.fabricProductService.retrieveFabricProductBySlug(slug);
    if (!fabricProduct) throw new NotFoundException(`Fabric product "${slug}" not found.`);
    return keyedResponse("fabricProduct", fabricProduct);
  }

  /** FabricProductDAOController#retrieveFabricProductBySlugV2(String slug) — functionally identical to V1 in source. */
  @Get(["/get/fabric-product/slug-v2/:productSlug", "/get/v2/fabric-product/slug/:productSlug"])
  @ApiOperation({ summary: "Retrieve a fabric product by slug (v2, functionally identical to v1)." })
  @ApiResponse({ status: 200, description: "Fabric product." })
  @ApiResponse({ status: 404, description: "No product with that slug." })
  // No gate, matching the v1 route above. v2 returns the same product for the same
  // slug, so a CODE_SU gate here protected nothing — the identical payload was
  // already public via /get/fabric-product/slug/:productSlug — while 401ing the
  // storefront PDP, which calls the v2 path.
  async getFabricProductBySlugV2(@Param("productSlug") productSlug: string) {
    const slug = parseProductSlugParam(productSlug);
    const fabricProduct = await this.fabricProductService.retrieveFabricProductBySlugV2(slug);
    if (!fabricProduct) throw new NotFoundException(`Fabric product "${slug}" not found.`);
    return keyedResponse("fabricProduct", fabricProduct);
  }

  /**
   * FabricProductController#getFabricOverviewList (loom) ->
   * fabricOverviewResponse.buildList(daoController.retrieveFabricOverviews()).
   *
   * `/get/fabric-overview-list` is the legacy path; `/get/fabric-product/overview/list`
   * is the name this API gave it. Both are served so unmigrated clients keep working —
   * the legacy path is the one Loom published, and the storefront/CMS are not its only
   * possible callers.
   *
   * Gate: Loom routes this through getEntity(..., CODE_SU, UNAUTH_FABRIC_OVERVIEW_LIST_REQUEST),
   * so it is super-user only. It was previously ungated here; no frontend calls either
   * path (grepped across apps/storefront/src and apps/cms/src), so restoring the gate
   * matches the original without breaking a caller.
   */
  @Get(["/get/fabric-product/overview/list", "/get/fabric-overview-list"])
  @ApiOperation({ summary: "List lightweight fabric product overviews." })
  @ApiResponse({ status: 200, description: "Full fabric overview list." })
  @RequireGate(GateCode.CODE_SU)
  async getFabricOverviews() {
    const overviews = await this.fabricProductService.retrieveFabricOverviews();
    return keyedResponse("fabricOverviewList", overviews);
  }

  /** FabricProductDAOController#retrieveFabricProductData(int page, int size) */
  /**
   * `/get/table-explorer/data/fabric-product-data` is the legacy path
   * (RequestMapper.GET_TABLE_EXPLORER_DATA_FABRIC_PRODUCT_DATA); this API renamed it
   * to `/fabric-product`. Both are served: the generic
   * `/get/table-explorer/data/:tableName` handler cannot stand in for the legacy
   * name because it feeds tableName straight to sql.identifier(), so
   * "fabric-product-data" resolves to a table that does not exist rather than to
   * this projection.
   */
  @Get(["/get/table-explorer/data/fabric-product", "/get/table-explorer/data/fabric-product-data"])
  @ApiOperation({ summary: "Paginated table-explorer projection of fabric products." })
  @ApiQuery({ name: "page", required: false, example: 0, description: "Page number (0-indexed)" })
  @ApiQuery({ name: "size", required: false, example: 20, description: "Page size" })
  @ApiResponse({ status: 200, description: "Page of fabric product data." })
  @RequireGate(GateCode.CODE_SU)
  async getFabricProductData(@Query() query: unknown) {
    const { page, size } = parsePageQuery(query);
    const data = await this.fabricProductService.retrieveFabricProductData(page, size);
    return keyedResponse("fabricProductDataList", data);
  }

  /** FabricProductDAOController#findFabricFilterPreview(categoryName ?? null, segmentCategoryName ?? null) */
  @Get("/get/fabric-product/filter-preview")
  @ApiOperation({ summary: "Fabric filter-preview list, optionally scoped by category/segment-category name." })
  @ApiQuery({ name: "categoryName", required: false, description: "Category name" })
  @ApiQuery({ name: "segmentCategoryName", required: false, description: "Segment category name" })
  @ApiResponse({ status: 200, description: "Matching fabric filter previews." })
  async getFabricFilterPreview(@Query() query: unknown) {
    const { categoryName, segmentCategoryName } = parseFabricFilterPreviewQuery(query);
    const previews = await this.fabricProductService.findFabricFilterPreview(categoryName ?? null, segmentCategoryName ?? null);
    return keyedResponse("fabricFilterPreviewList", previews);
  }

  /** FabricProductDAOController#findFabricFilterPreviewPage(categoryName ?? null, segmentCategoryName ?? null, limit, offset) */
  @Get("/get/fabric-product/filter-preview/page")
  @ApiOperation({ summary: "Paginated fabric filter-preview list." })
  @ApiQuery({ name: "categoryName", required: false, description: "Category name" })
  @ApiQuery({ name: "segmentCategoryName", required: false, description: "Segment category name" })
  @ApiQuery({ name: "limit", required: false, example: 20, description: "Limit" })
  @ApiQuery({ name: "offset", required: false, example: 0, description: "Offset" })
  @ApiResponse({ status: 200, description: "Page of matching fabric filter previews." })
  async getFabricFilterPreviewPage(@Query() query: unknown) {
    const { categoryName, segmentCategoryName, limit, offset } = parseFabricFilterPreviewPageQuery(query);
    const previews = await this.fabricProductService.findFabricFilterPreviewPage(categoryName ?? null, segmentCategoryName ?? null, limit, offset);
    return keyedResponse("fabricFilterPreviewList", previews);
  }

  /** FabricProductDAOController#findFabricFilterPreviewByIDs(ids) */
  @Get("/get/fabric-product/filter-preview/by-ids")
  @ApiOperation({ summary: "Fabric filter previews for a comma-separated list of ids." })
  @ApiResponse({ status: 200, description: "Matching fabric filter previews." })
  async getFabricFilterPreviewByIds(@Query("ids") ids: string) {
    const parsedIds = parseFabricFilterPreviewIds(ids);
    const previews = await this.fabricProductService.findFabricFilterPreviewByIds(parsedIds);
    return keyedResponse("fabricFilterPreviewList", previews);
  }

  /** FabricProductDAOController#findFabricFilterPreviewFiltered(...) */
  @Get("/get/fabric-product/filter-preview/filtered")
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
  @ApiBody({ type: CreateFabricProductDto })
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
  @ApiBody({ type: UpdateFabricProductDto })
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
  @ApiBody({ type: DisableProductDto })
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
  @ApiBody({ type: ZohoTriggerDto })
  @ApiResponse({ status: 200, description: "Trigger result." })
  async triggerZohoWorkflow(@CurrentTenant() tenant: AuthenticatedTenant, @Body() body: unknown) {
    const data = parseProductZohoTriggerData(body);
    const result = await this.fabricProductService.triggerZohoWorkflow(tenant.id, data);
    return simpleResponse(result === 1, result === 1 ? "Zoho workflow triggered." : "Fabric product not found.");
  }
}
