import { BadRequestException, Body, ConflictException, Controller, Get, NotFoundException, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { FinishedProductService } from "../finished-product/service/finished-product.service.js";
import { OptimisticLockError } from "../finished-product/repository/finished-product.repository.js";
import { AuthenticatedTenant, GateCode, RequireGate, RolesGuard } from "../../../common/auth/roles.guard.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import { keyedResponse, simpleResponse } from "../../../common/response/rain-response.js";
import {
  CreateFinishedProductDto,
  ProductDisableRequestDto,
  ProductZohoTriggerDto,
  UpdateFinishedProductDto,
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

  /**
   * `/get/finished-product/slug/` (empty slug) otherwise falls through to
   * `/get/finished-product/:productId` with productId="slug" and answers
   * 400 "productId must be an integer". Declared before the `:productId`
   * route because Express matches in registration order.
   */
  @Get("/get/finished-product/slug")
  @ApiOperation({ summary: "Reserved — an empty slug is a 404, not a product id." })
  @ApiResponse({ status: 404, description: "No slug supplied." })
  emptySlug(): never {
    throw new NotFoundException("A product slug is required.");
  }

  /** FinishedProductDAOController#retrieveFinishedProduct(Long id) */
  @Get("/get/finished-product/:productId")
  @ApiOperation({ summary: "Retrieve a fully-enriched finished product by id." })
  @ApiParam({ name: "productId", description: "Finished Product ID (e.g. 2728, 3071, 3644)", example: 2728, type: Number })
  @ApiResponse({ status: 200, description: "Finished product." })
  @ApiResponse({ status: 400, description: "Malformed product id." })
  @ApiResponse({ status: 404, description: "No such finished product." })
  async getFinishedProduct(@Param("productId") productId: string) {
    const finishedProduct = await this.finishedProductService.retrieveFinishedProduct(parseProductIdParam(productId));
    if (!finishedProduct) throw new NotFoundException(`Finished product ${productId} not found.`);
    return keyedResponse("finishedProduct", finishedProduct);
  }

  /** FinishedProductDAOController#retrieveFinishedProductBySlug(String productSlug) */
  @Get("/get/finished-product/slug/:productSlug")
  @ApiOperation({ summary: "Retrieve a finished product by its slug." })
  @ApiParam({ name: "productSlug", description: "Product Slug (e.g. a-line-panel-dress-solid-white, mandarin-collar-dress, slim-fit-trouser)", example: "a-line-panel-dress-solid-white", type: String })
  @ApiResponse({ status: 200, description: "Finished product." })
  @ApiResponse({ status: 404, description: "No product with that slug." })
  async getFinishedProductBySlug(@Param("productSlug") productSlug: string) {
    const slug = parseProductSlugParam(productSlug);
    const finishedProduct = await this.finishedProductService.retrieveFinishedProductBySlug(slug);
    if (!finishedProduct) throw new NotFoundException(`Finished product "${slug}" not found.`);
    return keyedResponse("finishedProduct", finishedProduct);
  }

  /**
   * FinishedProductDAOController#createFinishedProduct(LoomTenant tenant,
   * FinishedProduct finishedProduct)
   */
  @Post("/add/finished-product")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create a new finished product (and its underlying core product row)." })
  @ApiBody({ type: CreateFinishedProductDto })
  @ApiResponse({ status: 200, description: "Creation result." })
  async createFinishedProduct(@CurrentTenant() tenant: AuthenticatedTenant, @Body() body: unknown) {
    const input = parseCreateFinishedProductRequest(body);
    const result = await this.finishedProductService.createFinishedProduct(tenant?.id ?? 1, input);
    return simpleResponse(
      result === ActionCode.INSERT_SUCCESS,
      result === ActionCode.INSERT_SUCCESS ? "Finished product created successfully." : "Failed to create finished product.",
    );
  }

  /**
   * FinishedProductDAOController#updateFinishedProduct(LoomTenant tenant,
   * FinishedProduct updatedEntity)
   */
  @Patch("/update/finished-product")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update an existing finished product." })
  @ApiBody({ type: UpdateFinishedProductDto })
  @ApiResponse({ status: 200, description: "Update result." })
  @ApiResponse({ status: 409, description: "Finished product was modified by another request." })
  async updateFinishedProduct(@CurrentTenant() tenant: AuthenticatedTenant, @Body() body: unknown) {
    const input = parseUpdateFinishedProductRequest(body);
    const { id } = input;
    if (id === undefined) throw new BadRequestException("Finished product id is required.");
    let result: number;
    try {
      result = await this.finishedProductService.updateFinishedProduct(tenant?.id ?? 1, { ...input, id });
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
   * disableFinishedProduct(ProductDisableRequest)
   */
  @Patch("/disable/finished-product")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Enable/disable a finished product." })
  @ApiBody({ type: ProductDisableRequestDto })
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
  @ApiBody({ type: ProductZohoTriggerDto })
  @ApiResponse({ status: 200, description: "Trigger result." })
  async triggerZohoWorkflow(@CurrentTenant() tenant: AuthenticatedTenant, @Body() body: unknown) {
    const data = parseProductZohoTriggerData(body);
    const result = await this.finishedProductService.triggerZohoWorkflow(tenant?.id ?? 1, data);
    return simpleResponse(result === 1, result === 1 ? "Zoho workflow triggered." : "Finished product not found.");
  }

  /** FinishedProductDAOController#retrieveFinishedProductData(int page, int size) */
  // `/get/finished-preview-list` used to be aliased onto this route. That was wrong
  // twice over: it is CODE_SU-gated (the storefront calls it anonymously) and it
  // answers with `finishedProductDataList`, a table-explorer projection the
  // storefront cannot read — it looks for `productPreviewList`/`products`/`entity`.
  // The public alias now lives in filter.controller.ts next to its fabric sibling.
  @Get("/get/table-explorer/data/finished-product")
  @ApiOperation({ summary: "Paginated projection of finished products." })
  @ApiResponse({ status: 200, description: "Page of finished product data." })
  @RequireGate(GateCode.CODE_SU)
  async getFinishedProductData(@Query() query: unknown) {
    const { page, size } = parseTableExplorerPageQuery(query);
    const data = await this.finishedProductService.retrieveFinishedProductData(page, size);
    return keyedResponse("finishedProductDataList", data);
  }
}
