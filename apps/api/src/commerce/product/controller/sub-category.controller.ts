// @ts-nocheck
/**
 * apps/api/src/product/sub_category/SubCategory.controller.ts
 *
 * Direct port of com.bloomscorp.loom.product.sub_category.controller.SubCategoryController's
 * and .SubCategoryPreviewController's business logic — routes follow the
 * same "/verb/resource[/:id]" convention already source-established in
 * auth.controller.ts, cart.controller.ts, category.controller.ts, and
 * SkuGroup.controller.ts. NOT SOURCE-VERIFIED against a live
 * RequestMapper.class dump (no SubCategory.module.ts was uploaded either,
 * unlike every other domain in this batch — controller wiring here follows
 * the same deferred-RequestMapper pattern regardless).
 *
 * Route map (inferred — see note above):
 *   GET    /get/sub-category/:subCategoryId                        CODE_SU
 *   GET    /get/sub-category/related/:subCategoryId                CODE_SU
 *   GET    /get/sub-category/list                                   CODE_SU
 *   GET    /get/sub-category/fuzzy-search                           CODE_SU
 *   POST   /add/sub-category                             (multipart) CODE_SU
 *   PATCH  /update/sub-category/:subCategoryId            (multipart) CODE_SU
 *   DELETE /delete/sub-category/:subCategoryId                       CODE_SU
 *   GET    /get/sub-category/featured/:categoryName                  CODE_SU
 *   GET    /get/table-explorer/data/sub-category                       CODE_SU
 *   GET    /get/table-explorer/data/sub-category/:id                    CODE_SU
 *
 * Multipart handling: SubCategory.dto.ts's parse functions read
 * iconFile/socialImageFile/featuredImageFile directly off the parsed
 * `body` object (unlike category.controller.ts's two-argument
 * parse(body, files) split) — so uploaded files are merged into the body
 * object here before parsing, matching what the DTO layer actually
 * expects.
 *
 * createSubCategory / updateSubCategory return an ActionCode number;
 * ActionCode.INSERT_SUCCESS / UPDATE_SUCCESS drive the response, same
 * convention as SkuGroup.controller.ts.
 *
 * deleteSubCategory: SubCategoryService#deleteSubCategory already returns
 * a { success, message } shape (source's descriptive-string pattern,
 * pre-split into a boolean + message) — surfaced directly.
 */
import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SubCategoryService } from "../sub-category/service/subCategory.service.js";
import { OptimisticLockError } from "../sub-category/repository/subCategory.repository.js";
import { GateCode, RequireGate, RolesGuard } from "../../../common/auth/roles.guard.js";
import { keyedResponse, simpleResponse } from "../../../common/response/rain-response.js";
import {
  parseCategoryNameParam,
  parseCreateSubCategoryRequest,
  parseIdParam,
  parseSubCategoryIdParam,
  parseTableExplorerPageQuery,
  parseUpdateSubCategoryRequest,
} from "../sub-category/dto/subcategory.dto.js";
import { SubCategoryMessages } from "../sub-category/types/sub-category.types.js";
import { ActionCode } from "../../../common/errors/action-code.js";

const FILE_FIELDS = [{ name: "iconFile", maxCount: 1 }, { name: "socialImageFile", maxCount: 1 }, { name: "featuredImageFile", maxCount: 1 }];

/** Merges @UploadedFiles()'s { field: [file] } shape into a plain body object, matching what SubCategory.dto.ts's parse functions expect on `body.iconFile` etc. */
function mergeFilesIntoBody(body: unknown, files: unknown): unknown {
  const b = (body ?? {}) as Record<string, unknown>;
  const f = (files ?? {}) as Record<string, unknown[]>;
  return {
    ...b,
    iconFile: f.iconFile?.[0] ?? b.iconFile,
    socialImageFile: f.socialImageFile?.[0] ?? b.socialImageFile,
    featuredImageFile: f.featuredImageFile?.[0] ?? b.featuredImageFile,
  };
}

@ApiTags("SubCategory")
@Controller()
@UseGuards(RolesGuard)
export class SubCategoryController {
  constructor(private readonly subCategoryService: SubCategoryService) {}

  /** SubCategoryPreviewDAOController#retrieveSubCategoryList() */
  @Get("/get/sub-category/list")
  @ApiOperation({ summary: "List every sub-category preview." })
  @ApiResponse({ status: 200, description: "Full sub-category preview list." })
  async getSubCategoryList() {
    const subCategories = await this.subCategoryService.retrieveSubCategoryList();
    return keyedResponse("subCategoryList", subCategories);
  }

  /** SubCategoryDAOController#retrieveSubCategoryWithRelatedEntities(Long id) */
  @Get("/get/sub-category/related/:subCategoryId")
  @ApiOperation({ summary: "Retrieve a single sub-category by id, with related entities resolved." })
  @ApiParam({ name: "subCategoryId", description: "SubCategory ID", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Sub-category or null." })
  async getSubCategoryWithRelatedEntities(@Param("subCategoryId") subCategoryId: string) {
    const id = BigInt(parseSubCategoryIdParam(subCategoryId));
    const subCategory = await this.subCategoryService.retrieveSubCategoryWithRelatedEntities(id);
    return keyedResponse("subCategory", subCategory);
  }

  /** SubCategoryDAOController#retrieveSubCategory(Long id) */
  @Get("/get/sub-category/:subCategoryId")
  @ApiOperation({ summary: "Retrieve a single sub-category by id." })
  @ApiParam({ name: "subCategoryId", description: "SubCategory ID", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Sub-category or null." })
  async getSubCategory(@Param("subCategoryId") subCategoryId: string) {
    const id = BigInt(parseSubCategoryIdParam(subCategoryId));
    const subCategory = await this.subCategoryService.retrieveSubCategory(id);
    return keyedResponse("subCategory", subCategory);
  }

  /** retrieveFuzzySubCategoryPreviewsFromString(String text[, int limit]) */
  @Get("/get/sub-category/fuzzy-search")
  @ApiOperation({ summary: "Fuzzy-search sub-category previews by name." })
  @ApiResponse({ status: 200, description: "Matching sub-category previews." })
  async fuzzySearchSubCategories(@Query("text") text: string, @Query("limit") limit?: string) {
    const parsedLimit = limit !== undefined ? Number(limit) : undefined;
    const subCategories = await this.subCategoryService.retrieveFuzzySubCategoryPreviews(
      text,
      parsedLimit !== undefined && !Number.isNaN(parsedLimit) ? parsedLimit : undefined,
    );
    return keyedResponse("subCategoryList", subCategories);
  }

  /** createNewSubCategory(SubCategory) — multipart, segmentId required, profile ids optional. */
  @Post("/add/sub-category")
  @RequireGate(GateCode.CODE_SU)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileFieldsInterceptor(FILE_FIELDS))
  @ApiOperation({ summary: "Create a new sub-category under a segment." })
  @ApiResponse({ status: 200, description: "Sub-category created." })
  @ApiResponse({ status: 404, description: "Segment or a referenced profile not found." })
  async createNewSubCategory(@Body() body: unknown, @UploadedFiles() files: unknown) {
    const input = parseCreateSubCategoryRequest(mergeFilesIntoBody(body, files));
    const result = await this.subCategoryService.createSubCategory(input);
    return simpleResponse(
      result === ActionCode.INSERT_SUCCESS,
      result === ActionCode.INSERT_SUCCESS ? SubCategoryMessages.NEW_SUB_CATEGORY_CREATED : "Failed to create sub category.",
    );
  }

  /**
   * updateSubCategory(SubCategory, Long subCategoryId) — multipart.
   * SubCategoryService#updateSubCategory lets an uncaught
   * OptimisticLockError propagate (source's unmodeled
   * OptimisticLockException, same convention as SkuGroup/Cart) — caught
   * here and surfaced as 409 Conflict.
   */
  @Patch("/update/sub-category/:subCategoryId")
  @RequireGate(GateCode.CODE_SU)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileFieldsInterceptor(FILE_FIELDS))
  @ApiOperation({ summary: "Update an existing sub-category." })
  @ApiResponse({ status: 200, description: "Sub-category updated." })
  @ApiResponse({ status: 404, description: "Segment or a referenced profile not found." })
  @ApiResponse({ status: 409, description: "Sub-category was modified by another request." })
  async updateSubCategory(
    @Param("subCategoryId") subCategoryId: string,
    @Body() body: unknown,
    @UploadedFiles() files: unknown,
  ) {
    const input = parseUpdateSubCategoryRequest(mergeFilesIntoBody(body, files), subCategoryId);
    let result: number;
    try {
      result = await this.subCategoryService.updateSubCategory(input);
    } catch (err) {
      if (err instanceof OptimisticLockError) {
        throw new ConflictException("This sub category was modified by another request. Please retry.");
      }
      throw err;
    }
    return simpleResponse(
      result === ActionCode.UPDATE_SUCCESS,
      result === ActionCode.UPDATE_SUCCESS ? SubCategoryMessages.SUB_CATEGORY_UPDATED : "Failed to update sub category.",
    );
  }

  /**
   * deleteSubCategory(Long id) — refuses deletion when products are still
   * attached, returning the source's descriptive string; already split
   * into { success, message } by the service.
   */
  @Delete("/delete/sub-category/:subCategoryId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete a sub-category (refused if products are still attached)." })
  @ApiResponse({ status: 200, description: "Deletion result — success or a descriptive refusal reason." })
  async deleteSubCategory(@Param("subCategoryId") subCategoryId: string) {
    const id = BigInt(parseSubCategoryIdParam(subCategoryId));
    const { success, message } = await this.subCategoryService.deleteSubCategory(id);
    return simpleResponse(success, success ? SubCategoryMessages.SUB_CATEGORY_DELETED : message);
  }

  /** getFeaturedSubCategories(String categoryName) */
  @Get("/get/sub-category/featured/:categoryName")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "List sub-categories marked featured within a category." })
  @ApiResponse({ status: 200, description: "Matching featured sub-categories." })
  async getFeaturedSubCategories(@Param("categoryName") categoryName: string) {
    const name = parseCategoryNameParam(categoryName);
    const subCategories = await this.subCategoryService.getFeaturedSubCategories(name);
    return keyedResponse("featuredSubCategoryList", subCategories);
  }

  /** retrieveSubCategoryData(int page, int size) */
  @Get("/get/table-explorer/data/sub-category")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Paginated table-explorer projection of sub-categories." })
  @ApiResponse({ status: 200, description: "Page of sub-category data." })
  async getSubCategoryData(@Query() query: unknown) {
    const { page, size } = parseTableExplorerPageQuery(query);
    const data = await this.subCategoryService.retrieveSubCategoryData(page, size);
    return keyedResponse("subCategoryDataList", data);
  }

  /** retrieveSubCategoryDataById(Long id) */
  @Get("/get/table-explorer/data/sub-category/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table-explorer projection of a single sub-category." })
  @ApiResponse({ status: 200, description: "Sub-category data or null." })
  async getSubCategoryDataById(@Param("id") id: string) {
    const parsedId = BigInt(parseIdParam(id));
    const data = await this.subCategoryService.retrieveSubCategoryDataById(parsedId);
    return keyedResponse("subCategoryData", data);
  }
}
// @ts-nocheck
