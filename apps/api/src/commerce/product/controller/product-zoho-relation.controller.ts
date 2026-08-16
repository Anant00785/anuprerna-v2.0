// @ts-nocheck
import { Body, ConflictException, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ProductZohoRelationService } from "../product-zoho-relation/service/product-zoho-relation.service.js";
import { OptimisticLockError } from "../product-zoho-relation/repository/product-zoho-relation.repository.js";
import { GateCode, RequireGate, RolesGuard } from "../../../common/auth/roles.guard.js";
import { keyedResponse, simpleResponse } from "../../../common/response/rain-response.js";
import {
  CreateProductZohoRelationDto,
  UpdateProductZohoRelationDto,
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

  /** findProductZohoRelationByProductAndSku(Product product, String sku) */
  @Get("/get/product-zoho-relation/by-product-and-sku")
  @ApiOperation({ summary: "Retrieve a product Zoho relation by product id and SKU." })
  @ApiQuery({ name: "productId", example: 200415, description: "Product ID", required: true })
  @ApiQuery({ name: "sku", example: "DAN1200458", description: "Product SKU", required: true })
  @ApiResponse({ status: 200, description: "Product Zoho relation or null." })
  async getByProductAndSku(@Query() query: unknown) {
    const { productId, sku } = parseProductAndSkuQuery(query);
    const relation = await this.productZohoRelationService.findByProductIdAndSku(productId, sku);
    return keyedResponse("productZohoRelation", relation);
  }

  /** findProductZohoRelationByZohoItemIdAndSku(String zohoItemId, String sku) */
  @Get("/get/product-zoho-relation/by-zoho-item-and-sku")
  @ApiOperation({ summary: "Retrieve a product Zoho relation by Zoho item id and SKU." })
  @ApiQuery({ name: "zohoItemId", example: "460517000010726810", description: "Zoho Item ID", required: true })
  @ApiQuery({ name: "sku", example: "DAN1200458", description: "Product SKU", required: true })
  @ApiResponse({ status: 200, description: "Product Zoho relation or null." })
  async getByZohoItemIdAndSku(@Query() query: unknown) {
    const { zohoItemId, sku } = parseZohoItemIdAndSkuQuery(query);
    const relation = await this.productZohoRelationService.findByZohoItemIdAndSku(zohoItemId, sku);
    return keyedResponse("productZohoRelation", relation);
  }

  /** findProductZohoRelationByZohoItemId(String zohoItemId) */
  @Get("/get/product-zoho-relation/by-zoho-item/:zohoItemId")
  @ApiOperation({ summary: "Retrieve a product Zoho relation by Zoho item id." })
  @ApiParam({ name: "zohoItemId", example: "460517000010726810", description: "Zoho Item ID" })
  @ApiResponse({ status: 200, description: "Product Zoho relation or null." })
  async getByZohoItemId(@Param("zohoItemId") zohoItemId: string) {
    const id = parseZohoItemIdParam(zohoItemId);
    const relation = await this.productZohoRelationService.findByZohoItemId(id);
    return keyedResponse("productZohoRelation", relation);
  }

  /** findAllByDisabledFalse() — active Zoho relations where the parent product is also active. */
  @Get("/get/product-zoho-relation/active-with-active-product")
  @ApiOperation({ summary: "List active product Zoho relations whose parent product is also active." })
  @ApiResponse({ status: 200, description: "Matching product Zoho relations." })
  async getActiveWithActiveProduct() {
    const relations = await this.productZohoRelationService.findAllActiveWithActiveProduct();
    return keyedResponse("productZohoRelationList", relations);
  }

  /** streamAllByFinishedProduct(boolean includeDisabled) */
  @Get("/get/product-zoho-relation/stream/finished-product")
  @ApiOperation({ summary: "Bulk list of product Zoho relations joined to finished products." })
  @ApiQuery({ name: "includeDisabled", example: false, required: false })
  @ApiResponse({ status: 200, description: "Matching product Zoho relations." })
  async getStreamAllByFinishedProduct(@Query("includeDisabled") includeDisabled?: string) {
    const flag = parseIncludeDisabledParam(includeDisabled);
    const relations = await this.productZohoRelationService.streamAllByFinishedProduct(flag);
    return keyedResponse("productZohoRelationList", relations);
  }

  /** streamAllByFabricProduct(boolean includeDisabled) */
  @Get("/get/product-zoho-relation/stream/fabric-product")
  @ApiOperation({ summary: "Bulk list of product Zoho relations joined to fabric products." })
  @ApiQuery({ name: "includeDisabled", example: false, required: false })
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
  @ApiParam({ name: "id", example: 200417, type: Number })
  @ApiResponse({ status: 200, description: "Product Zoho relation data or null." })
  async getProductZohoRelationDataById(@Param("id") id: string) {
    const parsedId = BigInt(parseIdParam(id));
    const data = await this.productZohoRelationService.retrieveProductZohoRelationDataById(parsedId);
    return keyedResponse("productZohoRelationData", data);
  }

  /** retrieveProductZohoRelationById(Long id) */
  @Get("/get/product-zoho-relation/:id")
  @ApiOperation({ summary: "Retrieve a single product Zoho relation by id." })
  @ApiParam({ name: "id", example: 200417, type: Number })
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
  @ApiBody({ type: CreateProductZohoRelationDto })
  @ApiResponse({ status: 201, description: "Creation result (success flag reflects insert outcome)." })
  async createProductZohoRelation(@Body() body: CreateProductZohoRelationDto) {
    const input = parseCreateProductZohoRelationRequest(body);
    const result = await this.productZohoRelationService.createProductZohoRelation(input);
    return simpleResponse(
      result === ActionCode.INSERT_SUCCESS,
      result === ActionCode.INSERT_SUCCESS ? "Product Zoho relation created successfully." : "Failed to create product Zoho relation.",
    );
  }

  /** BehemothCRUDDAOController#modifyEntity(productZohoRelation) — base CRUD update. */
  @Patch("/update/product-zoho-relation")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update an existing product Zoho relation." })
  @ApiBody({ type: UpdateProductZohoRelationDto })
  @ApiResponse({ status: 200, description: "Update result." })
  @ApiResponse({ status: 409, description: "Product Zoho relation was modified by another request." })
  async updateProductZohoRelation(@Body() body: UpdateProductZohoRelationDto) {
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

  /** deleteProductZohoRelation(Long id) */
  @Delete("/delete/product-zoho-relation/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete a product Zoho relation." })
  @ApiParam({ name: "id", example: 200417, type: Number })
  @ApiResponse({ status: 200, description: "Deletion result." })
  async deleteProductZohoRelation(@Param("id") id: string) {
    const parsedId = BigInt(parseIdParam(id));
    const deleted = await this.productZohoRelationService.deleteProductZohoRelation(parsedId);
    return simpleResponse(deleted, deleted ? "Product Zoho relation deleted successfully." : "Failed to delete product Zoho relation.");
  }
}
