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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
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

const categoryMultipartSchema = {
  type: "object",
  properties: {
    name: { type: "string", example: "FABRIC", description: "Category Name" },
    iconFile: { type: "string", format: "binary", description: "Icon image file" },
    socialImageFile: { type: "string", format: "binary", description: "Social share image file" },
  },
};

@ApiTags("Category")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /** getCategoryList(request) */
  @Get("/get/category/list")
  @ApiOperation({ summary: "List every category." })
  @ApiResponse({ status: 200, description: "Full category list." })
  async getCategoryList() {
    const categories = await this.categoryService.retrieveCategoryList();
    return keyedResponse("categoryList", categories);
  }

  /** getCategory(request, categoryId) */
  @Get("/get/category/:categoryId")
  @ApiOperation({ summary: "Retrieve a single category by id." })
  @ApiParam({ name: "categoryId", description: "Category ID", example: 2558, type: Number })
  @ApiResponse({ status: 200, description: "Category found." })
  @RequireGate(GateCode.CODE_SU)
  async getCategory(@Param("categoryId") categoryId: string) {
    const id = parseCategoryIdParam(categoryId);
    const category = await this.categoryService.retrieveCategory(id);
    return keyedResponse("category", category);
  }

  /** createNewCategory(request, category) — multipart, iconFile/socialImageFile optional. */
  @Post("/add/category")
  @RequireGate(GateCode.CODE_SU)
  @ApiConsumes("multipart/form-data")
  @ApiBody({ schema: categoryMultipartSchema })
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
  @ApiBody({ schema: categoryMultipartSchema })
  @ApiParam({ name: "categoryId", description: "Category ID", example: 2558, type: Number })
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
  @ApiOperation({ summary: "Paginated table-explorer projection of categories." })
  @ApiResponse({ status: 200, description: "Page of category data." })
  @RequireGate(GateCode.CODE_SU)
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
  @ApiParam({ name: "categoryId", description: "Category ID", example: 2558, type: Number })
  @ApiResponse({ status: 200, description: "Deletion result — success or a descriptive refusal reason." })
  async deleteCategory(@Param("categoryId") categoryId: string) {
    const id = parseCategoryIdParam(categoryId);
    const result = await this.categoryService.deleteCategory(id);
    const succeeded = result === "";
    return simpleResponse(succeeded, succeeded ? CategoryMessages.CATEGORY_DELETED : result);
  }
}
