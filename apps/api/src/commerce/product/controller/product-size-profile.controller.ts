// @ts-nocheck
import { Body, ConflictException, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ProductSizeProfileService } from "../product-size-profile/service/product-size-profile.service.js";
import { OptimisticLockError } from "../product-size-profile/repository/product-size-profile.repository.js";
import { GateCode, RequireGate, RolesGuard } from "../../../common/auth/roles.guard.js";
import { keyedResponse, simpleResponse } from "../../../common/response/rain-response.js";
import {
  CreateProductSizeProfileDto,
  UpdateProductSizeProfileDto,
  parseConsumedFabricForImpactQuery,
  parseCreateProductSizeProfileRequest,
  parseIdParam,
  parseSizeProfileOptionIdParam,
  parseTableExplorerPageQuery,
  parseUpdateProductSizeProfileRequest,
} from "../product-size-profile/dto/product-size-profile.dto.js";
import { ActionCode } from "../../../common/errors/action-code.js";

@ApiTags("ProductSizeProfile")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class ProductSizeProfileController {
  constructor(private readonly productSizeProfileService: ProductSizeProfileService) {}

  /**
   * retrieveConsumedFabricForImpact(Long productId, Long sizeProfileOptionId)
   */
  @Get("/get/product-size-profile/consumed-fabric-for-impact")
  @ApiOperation({ summary: "Resolve the consumed-fabric value used for impact calculations, for a product/size-option pair." })
  @ApiQuery({ name: "productId", example: 107260025, description: "Parent Product ID", required: true })
  @ApiQuery({ name: "sizeProfileOptionId", example: 12562710, description: "Size Profile Option ID", required: true })
  @ApiResponse({ status: 200, description: "Consumed fabric value, or null if unresolved." })
  async getConsumedFabricForImpact(@Query() query: unknown) {
    const { productId, sizeProfileOptionId } = parseConsumedFabricForImpactQuery(query);
    const consumedFabric = await this.productSizeProfileService.retrieveConsumedFabricForImpact(productId, sizeProfileOptionId);
    return keyedResponse("consumedFabric", consumedFabric);
  }

  /** getProductSizeProfileBySizeOption(SizeProfileOption option) */
  @Get("/get/product-size-profile/by-size-option/:sizeProfileOptionId")
  @ApiOperation({ summary: "List product size profile rows for a given size profile option." })
  @ApiParam({ name: "sizeProfileOptionId", example: 12562710, description: "Size Profile Option ID" })
  @ApiResponse({ status: 200, description: "Matching product size profile rows." })
  async getProductSizeProfileBySizeOption(@Param("sizeProfileOptionId") sizeProfileOptionId: string) {
    const id = parseSizeProfileOptionIdParam(sizeProfileOptionId);
    const rows = await this.productSizeProfileService.getProductSizeProfileBySizeOption(id);
    return keyedResponse("productSizeProfileList", rows);
  }

  /**
   * deleteProductSizeProfileBySizeOption(SizeProfileOption option)
   */
  @Delete("/delete/product-size-profile/by-size-option/:sizeProfileOptionId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete every product size profile row for a given size profile option." })
  @ApiParam({ name: "sizeProfileOptionId", example: 12562710, description: "Size Profile Option ID" })
  @ApiResponse({ status: 200, description: "Always reports success." })
  async deleteProductSizeProfileBySizeOption(@Param("sizeProfileOptionId") sizeProfileOptionId: string) {
    const id = parseSizeProfileOptionIdParam(sizeProfileOptionId);
    const deleted = await this.productSizeProfileService.deleteProductSizeProfileBySizeOption(id);
    return simpleResponse(deleted, "Product size profile rows deleted successfully.");
  }

  /** retrieveProductSizeProfileData(int page, int size) */
  @Get("/get/table-explorer/data/product-size-profile")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Paginated table-explorer projection of product size profiles." })
  @ApiResponse({ status: 200, description: "Page of product size profile data." })
  async getProductSizeProfileData(@Query() query: unknown) {
    const { page, size } = parseTableExplorerPageQuery(query);
    const data = await this.productSizeProfileService.retrieveProductSizeProfileData(page, size);
    return keyedResponse("productSizeProfileDataList", data);
  }

  /** retrieveProductSizeProfileDataById(Long id) */
  @Get("/get/table-explorer/data/product-size-profile/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table-explorer projection of a single product size profile." })
  @ApiParam({ name: "id", example: 161702936, type: Number })
  @ApiResponse({ status: 200, description: "Product size profile data or null." })
  async getProductSizeProfileDataById(@Param("id") id: string) {
    const parsedId = BigInt(parseIdParam(id));
    const data = await this.productSizeProfileService.retrieveProductSizeProfileDataById(parsedId);
    return keyedResponse("productSizeProfileData", data);
  }

  /** retrieveProductSizeProfileById(Long id) — enriched with sizeProfileOption. */
  @Get("/get/product-size-profile/:id")
  @ApiOperation({ summary: "Retrieve a single product size profile by id, enriched with its size profile option." })
  @ApiParam({ name: "id", example: 161702936, type: Number })
  @ApiResponse({ status: 200, description: "Product size profile or null." })
  async getProductSizeProfile(@Param("id") id: string) {
    const parsedId = BigInt(parseIdParam(id));
    const profile = await this.productSizeProfileService.retrieveProductSizeProfileById(parsedId);
    return keyedResponse("productSizeProfile", profile);
  }

  /** BehemothCRUDDAOController#addNewEntity(productSizeProfile) — base CRUD create. */
  @Post("/add/product-size-profile")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create a new product size profile row." })
  @ApiBody({ type: CreateProductSizeProfileDto })
  @ApiResponse({ status: 201, description: "Creation result (success flag reflects insert outcome)." })
  async createProductSizeProfile(@Body() body: CreateProductSizeProfileDto) {
    const input = parseCreateProductSizeProfileRequest(body);
    const result = await this.productSizeProfileService.createProductSizeProfile(input);
    return simpleResponse(
      result === ActionCode.INSERT_SUCCESS,
      result === ActionCode.INSERT_SUCCESS ? "Product size profile created successfully." : "Failed to create product size profile.",
    );
  }

  /** BehemothCRUDDAOController#modifyEntity(productSizeProfile) — base CRUD update. */
  @Patch("/update/product-size-profile")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update an existing product size profile row." })
  @ApiBody({ type: UpdateProductSizeProfileDto })
  @ApiResponse({ status: 200, description: "Update result." })
  @ApiResponse({ status: 409, description: "Product size profile was modified by another request." })
  async updateProductSizeProfile(@Body() body: UpdateProductSizeProfileDto) {
    const input = parseUpdateProductSizeProfileRequest(body);
    let result: number;
    try {
      result = await this.productSizeProfileService.updateProductSizeProfile(input);
    } catch (err) {
      if (err instanceof OptimisticLockError) {
        throw new ConflictException("This product size profile was modified by another request. Please retry.");
      }
      throw err;
    }
    return simpleResponse(
      result === ActionCode.UPDATE_SUCCESS,
      result === ActionCode.UPDATE_SUCCESS ? "Product size profile updated successfully." : "Failed to update product size profile.",
    );
  }

  /** BehemothCRUDDAOController#deleteEntity(id) — base CRUD delete. */
  @Delete("/delete/product-size-profile/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete a product size profile row." })
  @ApiParam({ name: "id", example: 161702936, type: Number })
  @ApiResponse({ status: 200, description: "Deletion result." })
  async deleteProductSizeProfile(@Param("id") id: string) {
    const parsedId = BigInt(parseIdParam(id));
    const deleted = await this.productSizeProfileService.deleteProductSizeProfile(parsedId);
    return simpleResponse(deleted, deleted ? "Product size profile deleted successfully." : "Failed to delete product size profile.");
  }
}
