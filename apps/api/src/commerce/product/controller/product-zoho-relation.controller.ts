// @ts-nocheck
/**
 * apps/api/src/commerce/product-zoho-relation/controller/product-zoho-relation.controller.ts
 *
 * Direct port of com.bloomscorp.loom.product.product.controller.ProductZohoRelationController's
 * (base CRUD + custom finders) business logic. product-zoho-relation.service.ts's
 * own header says "No controller exists for this domain in this migration
 * pass" — lifted by this task, same as product-size-profile.controller.ts.
 * Routes follow the "/verb/resource[/:id]" convention already
 * source-established elsewhere in this project — NOT SOURCE-VERIFIED
 * against a live RequestMapper.class dump.
 *
 * PRE-EXISTING FILE-NAMING MISMATCH (not something this controller fixes):
 * product-zoho-relation.service.ts imports its DTO module from
 * "../dto/product-zoho-relation.dto.js", but the only DTO file actually
 * uploaded for this domain is named "Create product-zoho-relation.dto.ts".
 * This controller imports from the same "../dto/product-zoho-relation.dto.js"
 * path the service already expects — consistent with "do not modify
 * services", and left for the workspace-reorganization step the user is
 * already doing (per the brief) to resolve by renaming the file to match.
 *
 * No ProductZohoRelationMessages export exists — response message strings
 * below are inline literals, flagged NOT source-verified.
 *
 * Route map (inferred — see note above):
 *   GET    /get/product-zoho-relation/:id                                  CODE_SU
 *   POST   /add/product-zoho-relation                                       CODE_SU
 *   PATCH  /update/product-zoho-relation                                    CODE_SU
 *   DELETE /delete/product-zoho-relation/:id                                CODE_SU
 *   GET    /get/product-zoho-relation/by-product-and-sku                      CODE_SU
 *   GET    /get/product-zoho-relation/by-zoho-item-and-sku                     CODE_SU
 *   GET    /get/product-zoho-relation/by-zoho-item/:zohoItemId                  CODE_SU
 *   GET    /get/product-zoho-relation/active-with-active-product                 CODE_SU
 *   GET    /get/product-zoho-relation/stream/finished-product                    CODE_SU
 *   GET    /get/product-zoho-relation/stream/fabric-product                      CODE_SU
 *   GET    /get/table-explorer/data/product-zoho-relation                          CODE_SU
 *   GET    /get/table-explorer/data/product-zoho-relation/:id                      CODE_SU
 *
 * updateProductZohoRelation: ProductZohoRelationService lets an uncaught
 * OptimisticLockError propagate — caught here and surfaced as 409
 * Conflict, same convention as every other update route in this
 * migration.
 *
 * deleteProductZohoRelation: source's DAO method always returns an unused
 * empty string; the service already ported this as a boolean success flag
 * instead (see service class doc) — surfaced directly here.
 */
import { Body, ConflictException, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ProductZohoRelationService } from "../product-zoho-relation/service/product-zoho-relation.service.js";
import { OptimisticLockError } from "../product-zoho-relation/repository/product-zoho-relation.repository.js";
import { GateCode, RequireGate, RolesGuard } from "../../../common/auth/roles.guard.js";
import { keyedResponse, simpleResponse } from "../../../common/response/rain-response.js";
import {
  parseCreateProductZohoRelationRequest,
  parseIdParam,
  parseIncludeDisabledParam,
  parseProductAndSkuQuery,
  parseTableExplorerPageQuery,
  parseUpdateProductZohoRelationRequest,
  parseZohoItemIdAndSkuQuery,
  parseZohoItemIdParam,
} from "../product-zoho-relation/dto/product-zoho-relation.dto.js";
import { ActionCode } from "../../../common/errors/action-code.js";

@ApiTags("ProductZohoRelation")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class ProductZohoRelationController {
  constructor(private readonly productZohoRelationService: ProductZohoRelationService) {}

  /** retrieveProductZohoRelationById(Long id) */
  @Get("/get/product-zoho-relation/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Retrieve a single product Zoho relation by id." })
  @ApiResponse({ status: 200, description: "Product Zoho relation or null." })
  async getProductZohoRelation(@Param("id") id: string) {
    const parsedId = BigInt(parseIdParam(id));
    const relation = await this.productZohoRelationService.retrieveProductZohoRelationById(parsedId);
    return keyedResponse("productZohoRelation", relation);
  }

  /** BehemothCRUDDAOController#addNewEntity(productZohoRelation) — base CRUD create. */
  @Post("/add/product-zoho-relation")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create a new product Zoho relation." })
  @ApiResponse({ status: 200, description: "Creation result (success flag reflects insert outcome)." })
  async createProductZohoRelation(@Body() body: unknown) {
    const input = parseCreateProductZohoRelationRequest(body);
    const result = await this.productZohoRelationService.createProductZohoRelation(input);
    return simpleResponse(
      result === ActionCode.INSERT_SUCCESS,
      result === ActionCode.INSERT_SUCCESS ? "Product Zoho relation created successfully." : "Failed to create product Zoho relation.",
    );
  }

  /**
   * BehemothCRUDDAOController#modifyEntity(productZohoRelation) — base
   * CRUD update. OptimisticLockError caught here and surfaced as 409
   * Conflict.
   */
  @Patch("/update/product-zoho-relation")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update an existing product Zoho relation." })
  @ApiResponse({ status: 200, description: "Update result." })
  @ApiResponse({ status: 409, description: "Product Zoho relation was modified by another request." })
  async updateProductZohoRelation(@Body() body: unknown) {
    const input = parseUpdateProductZohoRelationRequest(body);
    let result: number;
    try {
      result = await this.productZohoRelationService.updateProductZohoRelation(input);
    } catch (err) {
      if (err instanceof OptimisticLockError) {
        throw new ConflictException("This product Zoho relation was modified by another request. Please retry.");
      }
      throw err;
    }
    return simpleResponse(
      result === ActionCode.UPDATE_SUCCESS,
      result === ActionCode.UPDATE_SUCCESS ? "Product Zoho relation updated successfully." : "Failed to update product Zoho relation.",
    );
  }

  /** deleteProductZohoRelation(Long id) — see file header on the boolean-flag adaptation. */
  @Delete("/delete/product-zoho-relation/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete a product Zoho relation." })
  @ApiResponse({ status: 200, description: "Deletion result." })
  async deleteProductZohoRelation(@Param("id") id: string) {
    const parsedId = BigInt(parseIdParam(id));
    const deleted = await this.productZohoRelationService.deleteProductZohoRelation(parsedId);
    return simpleResponse(deleted, deleted ? "Product Zoho relation deleted successfully." : "Failed to delete product Zoho relation.");
  }

  /** findProductZohoRelationByProductAndSku(Product product, String sku) */
  @Get("/get/product-zoho-relation/by-product-and-sku")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Retrieve a product Zoho relation by product id and SKU." })
  @ApiResponse({ status: 200, description: "Product Zoho relation or null." })
  async getByProductAndSku(@Query() query: unknown) {
    const { productId, sku } = parseProductAndSkuQuery(query);
    const relation = await this.productZohoRelationService.findByProductIdAndSku(productId, sku);
    return keyedResponse("productZohoRelation", relation);
  }

  /** findProductZohoRelationByZohoItemIdAndSku(String zohoItemId, String sku) */
  @Get("/get/product-zoho-relation/by-zoho-item-and-sku")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Retrieve a product Zoho relation by Zoho item id and SKU." })
  @ApiResponse({ status: 200, description: "Product Zoho relation or null." })
  async getByZohoItemIdAndSku(@Query() query: unknown) {
    const { zohoItemId, sku } = parseZohoItemIdAndSkuQuery(query);
    const relation = await this.productZohoRelationService.findByZohoItemIdAndSku(zohoItemId, sku);
    return keyedResponse("productZohoRelation", relation);
  }

  /** findProductZohoRelationByZohoItemId(String zohoItemId) */
  @Get("/get/product-zoho-relation/by-zoho-item/:zohoItemId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Retrieve a product Zoho relation by Zoho item id." })
  @ApiResponse({ status: 200, description: "Product Zoho relation or null." })
  async getByZohoItemId(@Param("zohoItemId") zohoItemId: string) {
    const id = parseZohoItemIdParam(zohoItemId);
    const relation = await this.productZohoRelationService.findByZohoItemId(id);
    return keyedResponse("productZohoRelation", relation);
  }

  /** findAllByDisabledFalse() — active Zoho relations where the parent product is also active. */
  @Get("/get/product-zoho-relation/active-with-active-product")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "List active product Zoho relations whose parent product is also active." })
  @ApiResponse({ status: 200, description: "Matching product Zoho relations." })
  async getActiveWithActiveProduct() {
    const relations = await this.productZohoRelationService.findAllActiveWithActiveProduct();
    return keyedResponse("productZohoRelationList", relations);
  }

  /** streamAllByFinishedProduct(boolean includeDisabled) — see service.ts STREAMING NOTE. */
  @Get("/get/product-zoho-relation/stream/finished-product")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Bulk list of product Zoho relations joined to finished products." })
  @ApiResponse({ status: 200, description: "Matching product Zoho relations." })
  async getStreamAllByFinishedProduct(@Query("includeDisabled") includeDisabled?: string) {
    const flag = parseIncludeDisabledParam(includeDisabled);
    const relations = await this.productZohoRelationService.streamAllByFinishedProduct(flag);
    return keyedResponse("productZohoRelationList", relations);
  }

  /** streamAllByFabricProduct(boolean includeDisabled) — see service.ts STREAMING NOTE. */
  @Get("/get/product-zoho-relation/stream/fabric-product")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Bulk list of product Zoho relations joined to fabric products." })
  @ApiResponse({ status: 200, description: "Matching product Zoho relations." })
  async getStreamAllByFabricProduct(@Query("includeDisabled") includeDisabled?: string) {
    const flag = parseIncludeDisabledParam(includeDisabled);
    const relations = await this.productZohoRelationService.streamAllByFabricProduct(flag);
    return keyedResponse("productZohoRelationList", relations);
  }

  /** retrieveProductZohoRelationData(int page, int size) */
  @Get("/get/table-explorer/data/product-zoho-relation")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Paginated table-explorer projection of product Zoho relations." })
  @ApiResponse({ status: 200, description: "Page of product Zoho relation data." })
  async getProductZohoRelationData(@Query() query: unknown) {
    const { page, size } = parseTableExplorerPageQuery(query);
    const data = await this.productZohoRelationService.retrieveProductZohoRelationData(page, size);
    return keyedResponse("productZohoRelationDataList", data);
  }

  /** retrieveProductZohoRelationDataById(Long id) */
  @Get("/get/table-explorer/data/product-zoho-relation/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table-explorer projection of a single product Zoho relation." })
  @ApiResponse({ status: 200, description: "Product Zoho relation data or null." })
  async getProductZohoRelationDataById(@Param("id") id: string) {
    const parsedId = BigInt(parseIdParam(id));
    const data = await this.productZohoRelationService.retrieveProductZohoRelationDataById(parsedId);
    return keyedResponse("productZohoRelationData", data);
  }
}
// @ts-nocheck
