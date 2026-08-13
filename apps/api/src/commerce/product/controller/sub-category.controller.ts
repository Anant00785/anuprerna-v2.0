// @ts-nocheck
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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
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
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class SubCategoryController {
  constructor(private readonly subCategoryService: SubCategoryService) {}

  @Get("/get/sub-category/list")
  @ApiOperation({ summary: "List every sub-category preview." })
  @ApiResponse({ status: 200, description: "Full sub-category preview list." })
  async getSubCategoryList() {
    const subCategories = await this.subCategoryService.retrieveSubCategoryList();
    return keyedResponse("subCategoryList", subCategories);
  }

  @Get("/get/sub-category/related/:subCategoryId")
  @ApiOperation({ summary: "Retrieve a single sub-category by id, with related entities resolved." })
  @ApiParam({ name: "subCategoryId", description: "SubCategory ID", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Sub-category or null." })
  async getSubCategoryWithRelatedEntities(@Param("subCategoryId") subCategoryId: string) {
    const id = BigInt(parseSubCategoryIdParam(subCategoryId));
    const subCategory = await this.subCategoryService.retrieveSubCategoryWithRelatedEntities(id);
    return keyedResponse("subCategory", subCategory);
  }

  @Get("/get/sub-category/:subCategoryId")
  @ApiOperation({ summary: "Retrieve a single sub-category by id." })
  @ApiParam({ name: "subCategoryId", description: "SubCategory ID", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Sub-category or null." })
  async getSubCategory(@Param("subCategoryId") subCategoryId: string) {
    const id = BigInt(parseSubCategoryIdParam(subCategoryId));
    const subCategory = await this.subCategoryService.retrieveSubCategory(id);
    return keyedResponse("subCategory", subCategory);
  }

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

  @Post("/add/sub-category")
  @RequireGate(GateCode.CODE_SU)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileFieldsInterceptor(FILE_FIELDS))
  @ApiOperation({ summary: "Create a new sub-category under a segment." })
  async createNewSubCategory(@Body() body: unknown, @UploadedFiles() files: unknown) {
    const input = parseCreateSubCategoryRequest(mergeFilesIntoBody(body, files));
    const result = await this.subCategoryService.createSubCategory(input);
    return simpleResponse(
      result === ActionCode.INSERT_SUCCESS,
      result === ActionCode.INSERT_SUCCESS ? SubCategoryMessages.NEW_SUB_CATEGORY_CREATED : "Failed to create sub category.",
    );
  }

  @Patch("/update/sub-category/:subCategoryId")
  @RequireGate(GateCode.CODE_SU)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileFieldsInterceptor(FILE_FIELDS))
  @ApiOperation({ summary: "Update an existing sub-category." })
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

  @Delete("/delete/sub-category/:subCategoryId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete a sub-category." })
  async deleteSubCategory(@Param("subCategoryId") subCategoryId: string) {
    const id = BigInt(parseSubCategoryIdParam(subCategoryId));
    const { success, message } = await this.subCategoryService.deleteSubCategory(id);
    return simpleResponse(success, success ? SubCategoryMessages.SUB_CATEGORY_DELETED : message);
  }

  @Get(["/get/sub-category/featured/:categoryName", "/get/featured/:categoryName/sub-category"])
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "List sub-categories marked featured within a category." })
  async getFeaturedSubCategories(@Param("categoryName") categoryName: string) {
    const name = parseCategoryNameParam(categoryName);
    const subCategories = await this.subCategoryService.getFeaturedSubCategories(name);
    return keyedResponse("featuredSubCategoryList", subCategories);
  }

  @Get("/get/table-explorer/data/sub-category")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Paginated table-explorer projection of sub-categories." })
  async getSubCategoryData(@Query() query: unknown) {
    const { page, size } = parseTableExplorerPageQuery(query);
    const data = await this.subCategoryService.retrieveSubCategoryData(page, size);
    return keyedResponse("subCategoryDataList", data);
  }

  @Get("/get/table-explorer/data/sub-category/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table-explorer projection of a single sub-category." })
  async getSubCategoryDataById(@Param("id") id: string) {
    const parsedId = BigInt(parseIdParam(id));
    const data = await this.subCategoryService.retrieveSubCategoryDataById(parsedId);
    return keyedResponse("subCategoryData", data);
  }
}
