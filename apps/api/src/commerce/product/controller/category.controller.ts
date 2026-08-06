/**
 * apps/api/src/commerce/product/category/controller/category.controller.ts
 *
 * Direct port of com.bloomscorp.loom.product.category.controller.CategoryController.
 * All six routes are CODE_SU (super-user only) in source — no CODE_CU/public
 * route exists on this controller.
 *
 * ROUTE PATHS ARE NOT SOURCE-VERIFIED. CategoryController's @GetMapping/etc.
 * values reference `RequestMapper.GET_CATEGORY`, `GET_CATEGORY_LIST`,
 * `ADD_CATEGORY`, `UPDATE_CATEGORY`, `DELETE_CATEGORY`, and the literal
 * `GET_TABLE_EXPLORER_DATA_CATEGORY` — the constant *names* are
 * source-verified (they're the exact identifiers CategoryController
 * imports/references), but `com.bloomscorp.loom.support.RequestMapper`
 * itself (which holds the literal path strings) is not in the uploaded
 * repository. Every module.ts for this batch of domains explicitly
 * deferred controller generation for this exact reason. The paths below
 * are inferred by following the same "/verb/resource[/:id]" convention
 * already source-established in auth.controller.ts and cart.controller.ts
 * (e.g. "/get/cart-item/list", "/add/cart-item") — confirm against a live
 * RequestMapper.class dump before shipping.
 *
 * Route map (inferred — see note above):
 *   GET    /get/category/:categoryId                  CODE_SU
 *   GET    /get/category/list                          CODE_SU
 *   POST   /add/category                    (multipart) CODE_SU
 *   PATCH  /update/category/:categoryId      (multipart) CODE_SU
 *   GET    /get/table-explorer/data/category            CODE_SU
 *   DELETE /delete/category/:categoryId                 CODE_SU
 *
 * Multipart handling: source's createNewCategory/updateCategory take
 * @ModelAttribute Category (multipart form with two optional file fields,
 * iconFile/socialImageFile — see types/category.types.ts UploadedFile).
 * FileFieldsInterceptor is used to populate both without requiring a
 * dedicated DTO class (this project has no class-validator installed —
 * same constraint noted throughout dto/category.dto.ts).
 *
 * deleteCategory: source's deleteEntityEnhancedResponse returns a
 * descriptive-string response (segment-count guard) rather than a plain
 * boolean; CategoryService#deleteCategory already mirrors that exactly
 * (returns "" on success, a descriptive message otherwise) — ported as-is.
 *
 * CategoryMessages' prose values are flagged NOT source-verified in
 * types/category.types.ts itself (LogMessage.java not in this repository);
 * reused here as the closest available approximation.
 */
import {
  Body,
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
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CategoryService } from "../category/service/category.service.js";
import { GateCode, RequireGate, RolesGuard } from "../../../common/auth/roles.guard.js";
import { keyedResponse, simpleResponse } from "../../../common/response/rain-response.js";
import {
  parseCategoryIdParam,
  parseCreateCategoryRequest,
  parseTableExplorerPageQuery,
  parseUpdateCategoryRequest,
} from "../category/dto/category.dto.js";
import { CategoryMessages } from "../category/types/category.types.js";

@ApiTags("Category")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /** getCategory(request, categoryId) */
  @Get("/get/category/:categoryId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Retrieve a single category by id." })
  @ApiResponse({ status: 200, description: "Category found." })
  async getCategory(@Param("categoryId") categoryId: string) {
    const id = parseCategoryIdParam(categoryId);
    const category = await this.categoryService.retrieveCategory(id);
    return keyedResponse("category", category);
  }

  /** getCategoryList(request) */
  @Get("/get/category/list")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "List every category." })
  @ApiResponse({ status: 200, description: "Full category list." })
  async getCategoryList() {
    const categories = await this.categoryService.retrieveCategoryList();
    return keyedResponse("categoryList", categories);
  }

  /** createNewCategory(request, category) — multipart, iconFile/socialImageFile optional. */
  @Post("/add/category")
  @RequireGate(GateCode.CODE_SU)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileFieldsInterceptor([{ name: "iconFile", maxCount: 1 }, { name: "socialImageFile", maxCount: 1 }]))
  @ApiOperation({ summary: "Create a new category." })
  @ApiResponse({ status: 200, description: "Category created." })
  @ApiResponse({ status: 400, description: "Category failed validation." })
  async createNewCategory(@Body() body: unknown, @UploadedFiles() files: unknown) {
    const input = parseCreateCategoryRequest(body, files);
    await this.categoryService.createNewCategory(input);
    return simpleResponse(true, CategoryMessages.NEW_CATEGORY_CREATED);
  }

  /** updateCategory(request, updatedCategory, categoryId) — multipart. */
  @Patch("/update/category/:categoryId")
  @RequireGate(GateCode.CODE_SU)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileFieldsInterceptor([{ name: "iconFile", maxCount: 1 }, { name: "socialImageFile", maxCount: 1 }]))
  @ApiOperation({ summary: "Update an existing category." })
  @ApiResponse({ status: 200, description: "Category updated." })
  @ApiResponse({ status: 400, description: "Category failed validation." })
  @ApiResponse({ status: 404, description: "Category not found." })
  async updateCategory(
    @Param("categoryId") categoryId: string,
    @Body() body: unknown,
    @UploadedFiles() files: unknown,
  ) {
    const id = parseCategoryIdParam(categoryId);
    const input = parseUpdateCategoryRequest(body, files);
    await this.categoryService.updateCategory(id, input);
    return simpleResponse(true, CategoryMessages.CATEGORY_UPDATED);
  }

  /** getCategoryData(request, page, size) */
  @Get("/get/table-explorer/data/category")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Paginated table-explorer projection of categories." })
  @ApiResponse({ status: 200, description: "Page of category data." })
  async getCategoryData(@Query() query: unknown) {
    const { page, size } = parseTableExplorerPageQuery(query);
    const data = await this.categoryService.retrieveCategoryData(page, size);
    return keyedResponse("categoryDataList", data);
  }

  /**
   * deleteCategory(request, categoryId) — CategoryService#deleteCategory
   * already returns "" on success or a descriptive message (e.g. segment
   * count guard) otherwise; both are surfaced as the response message.
   */
  @Delete("/delete/category/:categoryId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete a category (refused if segments are still attached)." })
  @ApiResponse({ status: 200, description: "Deletion result — success or a descriptive refusal reason." })
  async deleteCategory(@Param("categoryId") categoryId: string) {
    const id = parseCategoryIdParam(categoryId);
    const result = await this.categoryService.deleteCategory(id);
    const succeeded = result === "";
    return simpleResponse(succeeded, succeeded ? CategoryMessages.CATEGORY_DELETED : result);
  }
}