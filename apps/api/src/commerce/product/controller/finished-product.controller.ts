// @ts-nocheck
/**
 * apps/api/src/product/finished-product/controller/finished-product.controller.ts
 *
 * Direct port of com.bloomscorp.loom.product.product.controller.FinishedProductController's
 * business logic (see finished-product.service.ts's own header note:
 * controller generation deferred, cross-module deps ported as Ports).
 * Route paths follow the "/verb/resource[/:id]" convention already
 * source-established elsewhere in this project — NOT SOURCE-VERIFIED
 * against a live RequestMapper.class dump.
 *
 * No FinishedProductMessages export exists — response message strings
 * below are inline literals, flagged NOT source-verified, same caveat as
 * product.controller.ts / fabric-product.controller.ts.
 *
 * Route map (inferred — see note above):
 *   GET    /get/finished-product/:productId                       CODE_SU
 *   GET    /get/finished-product/slug/:productSlug                 CODE_SU
 *   POST   /add/finished-product                                    CODE_SU
 *   PATCH  /update/finished-product                                  CODE_SU
 *   PATCH  /disable/finished-product                                  CODE_SU
 *   POST   /trigger/finished-product/zoho-workflow                     CODE_SU
 *   GET    /get/table-explorer/data/finished-product                    CODE_SU
 *
 * createFinishedProduct/updateFinishedProduct/triggerZohoWorkflow take the
 * calling tenant's id in source (LoomTenant tenant); resolved here via
 * @CurrentTenant(), same as fabric-product.controller.ts.
 *
 * updateFinishedProduct/disableFinishedProduct: FinishedProductService lets
 * an uncaught OptimisticLockError propagate — caught here and surfaced as
 * 409 Conflict, same convention as fabric-product.controller.ts.
 */
import { Body, ConflictException, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { FinishedProductService } from "../finished-product/service/finished-product.service.js";
import { OptimisticLockError } from "../finished-product/repository/finished-product.repository.js";
import { AuthenticatedTenant, GateCode, RequireGate, RolesGuard } from "../../../common/auth/roles.guard.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import { keyedResponse, simpleResponse } from "../../../common/response/rain-response.js";
import {
  parseCreateFinishedProductRequest,
  parseProductDisableRequest,
  parseProductIdParam,
  parseProductSlugParam,
  parseProductZohoTriggerData,
  parseTableExplorerPageQuery,
  parseUpdateFinishedProductRequest,
} from "../finished-product/dto/finished-product.dto.js";
import { ActionCode } from "../../../common/errors/action-code.js";

@ApiTags("FinishedProduct")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class FinishedProductController {
  constructor(private readonly finishedProductService: FinishedProductService) {}

  /** FinishedProductDAOController#retrieveFinishedProduct(Long id) */
  @Get("/get/finished-product/:productId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Retrieve a fully-enriched finished product by id." })
  @ApiResponse({ status: 200, description: "Finished product or null." })
  async getFinishedProduct(@Param("productId") productId: string) {
    const id = BigInt(parseProductIdParam(productId));
    const finishedProduct = await this.finishedProductService.retrieveFinishedProduct(id);
    return keyedResponse("finishedProduct", finishedProduct);
  }

  /** FinishedProductDAOController#retrieveFinishedProductBySlug(String slug) */
  @Get("/get/finished-product/slug/:productSlug")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Retrieve a fully-enriched finished product by slug." })
  @ApiResponse({ status: 200, description: "Finished product or null." })
  async getFinishedProductBySlug(@Param("productSlug") productSlug: string) {
    const slug = parseProductSlugParam(productSlug);
    const finishedProduct = await this.finishedProductService.retrieveFinishedProductBySlug(slug);
    return keyedResponse("finishedProduct", finishedProduct);
  }

  /**
   * FinishedProductDAOController#createFinishedProduct(LoomTenant tenant,
   * FinishedProduct finishedProduct) — see finished-product.service.ts
   * class doc departure #1 for the two-step persist rationale.
   */
  @Post("/add/finished-product")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create a new finished product (and its underlying core product row)." })
  @ApiResponse({ status: 200, description: "Creation result (success flag reflects insert outcome)." })
  async createFinishedProduct(@CurrentTenant() tenant: AuthenticatedTenant, @Body() body: unknown) {
    const input = parseCreateFinishedProductRequest(body);
    const result = await this.finishedProductService.createFinishedProduct(tenant.id, input);
    return simpleResponse(
      result === ActionCode.INSERT_SUCCESS,
      result === ActionCode.INSERT_SUCCESS ? "Finished product created successfully." : "Failed to create finished product.",
    );
  }

  /**
   * FinishedProductDAOController#updateFinishedProduct(LoomTenant tenant,
   * FinishedProduct updatedEntity) — OptimisticLockError caught here and
   * surfaced as 409 Conflict.
   */
  @Patch("/update/finished-product")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update an existing finished product." })
  @ApiResponse({ status: 200, description: "Update result." })
  @ApiResponse({ status: 409, description: "Finished product was modified by another request." })
  async updateFinishedProduct(@CurrentTenant() tenant: AuthenticatedTenant, @Body() body: unknown) {
    const input = parseUpdateFinishedProductRequest(body);
    let result: number;
    try {
      result = await this.finishedProductService.updateFinishedProduct(tenant.id, input);
    } catch (err) {
      if (err instanceof OptimisticLockError) {
        throw new ConflictException("This finished product was modified by another request. Please retry.");
      }
      throw err;
    }
    return simpleResponse(
      result === ActionCode.UPDATE_SUCCESS,
      result === ActionCode.UPDATE_SUCCESS ? "Finished product updated successfully." : "Failed to update finished product.",
    );
  }

  /**
   * disableFinishedProduct(ProductDisableRequest) — restores each
   * ProductZohoRelation's disabled state from its matching
   * ProductSizeProfile when re-enabling, force-disables all when
   * disabling (see service class doc). OptimisticLockError caught here
   * too.
   */
  @Patch("/disable/finished-product")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Enable/disable a finished product and cascade to its Zoho relations." })
  @ApiResponse({ status: 200, description: "Toggle result." })
  @ApiResponse({ status: 409, description: "Finished product was modified by another request." })
  async disableFinishedProduct(@Body() body: unknown) {
    const request = parseProductDisableRequest(body);
    let result: number;
    try {
      result = await this.finishedProductService.disableFinishedProduct(request);
    } catch (err) {
      if (err instanceof OptimisticLockError) {
        throw new ConflictException("This finished product was modified by another request. Please retry.");
      }
      throw err;
    }
    return simpleResponse(
      result === ActionCode.UPDATE_SUCCESS,
      result === ActionCode.UPDATE_SUCCESS ? "Finished product disabled state updated." : "Failed to update finished product disabled state.",
    );
  }

  /** FinishedProductDAOController#triggerZohoWorkflow(LoomTenant tenant, ProductZohoTriggerData data) */
  @Post("/trigger/finished-product/zoho-workflow")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Re-trigger the Zoho workflow for a finished product." })
  @ApiResponse({ status: 200, description: "Trigger result." })
  async triggerZohoWorkflow(@CurrentTenant() tenant: AuthenticatedTenant, @Body() body: unknown) {
    const data = parseProductZohoTriggerData(body);
    const result = await this.finishedProductService.triggerZohoWorkflow(tenant.id, data);
    return simpleResponse(result === 1, result === 1 ? "Zoho workflow triggered." : "Finished product not found.");
  }

  /** FinishedProductDAOController#retrieveFinishedProductData(int page, int size) */
  @Get("/get/table-explorer/data/finished-product")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Paginated table-explorer projection of finished products." })
  @ApiResponse({ status: 200, description: "Page of finished product data." })
  async getFinishedProductData(@Query() query: unknown) {
    const { page, size } = parseTableExplorerPageQuery(query);
    const data = await this.finishedProductService.retrieveFinishedProductData(page, size);
    return keyedResponse("finishedProductDataList", data);
  }
}
// @ts-nocheck
