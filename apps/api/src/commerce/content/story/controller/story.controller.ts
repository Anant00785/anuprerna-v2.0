// @ts-nocheck
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RolesGuard, RequireGate } from "../../../../common/auth/roles.guard.js";
import { GateCode } from "../../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../../common/response/rain-response.js";
import { StoryService } from "../service/story.service.js";
import { parseStoryContentCategoryInput, parseStoryContentInput, parseStoryContentSectionInput, parseStoryProductMappingInput } from "../types/story.types.js";
import { validateStoryContentCategory, validateStoryContent, validateStoryContentSection, validateStoryProductMapping, sanitizeStoryContentCategory, sanitizeStoryContent, sanitizeStoryContentSection, sanitizeStoryProductMapping } from "../validator/story.validator.js";
import { ActionCode } from "../../../../common/errors/action-code.js";
import { CreateStoryCategoryDto, UpdateStoryCategoryDto, CreateStoryContentDto, UpdateStoryContentDto, CreateStorySectionDto, CreateStoryProductRelationDto } from "../dto/story.dto.js";

@Controller()
@ApiTags("Story")
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Get("/get/story-content-category-list")
  @ApiOperation({ summary: "List story content categories." })
  async getStoryContentCategoryList() {
    const list = await this.storyService.getStoryContentCategories();
    return keyedResponse("storyContentCategories", list);
  }

  @Post("/add/story-content-category")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Add a story content category." })
  @ApiBody({ type: CreateStoryCategoryDto })
  async addStoryContentCategory(@Body() raw: unknown) {
    const input = sanitizeStoryContentCategory(parseStoryContentCategoryInput(raw));
    const error = validateStoryContentCategory(input);
    if (error) return simpleResponse(false, error);
    const code = await this.storyService.addStoryContentCategory(input);
    return simpleResponse(code === ActionCode.INSERT_SUCCESS, code === ActionCode.INSERT_SUCCESS ? "Added successfully" : "Failed to add");
  }

  @Patch("/update/story-content-category")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update a story content category." })
  @ApiBody({ type: UpdateStoryCategoryDto })
  async updateStoryContentCategory(@Body() raw: unknown) {
    const input = sanitizeStoryContentCategory(parseStoryContentCategoryInput(raw));
    const error = validateStoryContentCategory(input);
    if (error) return simpleResponse(false, error);
    const code = await this.storyService.updateStoryContentCategory(input);
    return simpleResponse(code === ActionCode.UPDATE_SUCCESS, code === ActionCode.UPDATE_SUCCESS ? "Updated successfully" : "Failed to update");
  }

  @Get("/get/story-content-list")
  @ApiOperation({ summary: "List all story contents." })
  async getStoryContentList() {
    const list = await this.storyService.getStoryContentList();
    return keyedResponse("storyContents", list);
  }

  @Get("/get/story-content/:storyContentId")
  @ApiOperation({ summary: "Get story content by ID." })
  @ApiParam({ name: "storyContentId", description: "Story Content ID", example: 100, type: Number })
  async getStoryContent(@Param("storyContentId") storyContentId: string) {
    const story = await this.storyService.getStoryContentById(BigInt(storyContentId));
    return keyedResponse("storyContent", story);
  }

  @Get("/get/story-content/slug/:slug")
  @ApiOperation({ summary: "Get story content by SEO slug." })
  @ApiParam({ name: "slug", description: "Story SEO slug", example: "weaver-of-fulia-jamdani", type: String })
  async getStoryContentBySlug(@Param("slug") slug: string) {
    const story = await this.storyService.getStoryContentBySlug(slug);
    return keyedResponse("storyContent", story);
  }

  @Get("/get/stories/:storyId/recommended")
  @ApiOperation({ summary: "Get recommended stories for a given story ID." })
  @ApiParam({ name: "storyId", description: "Story ID", example: 100, type: Number })
  async getRecommendedStories(@Param("storyId") storyId: string) {
    const list = await this.storyService.getRecommendedStories(BigInt(storyId));
    return keyedResponse("storyContents", list);
  }

  @Get("/get/stories/category/:storyCategoryId")
  @ApiOperation({ summary: "Get stories by category ID." })
  @ApiParam({ name: "storyCategoryId", description: "Story Category ID", example: 1, type: Number })
  async getStoriesByCategory(@Param("storyCategoryId") storyCategoryId: string) {
    const list = await this.storyService.getStoriesByCategory(BigInt(storyCategoryId));
    return keyedResponse("storyContents", list);
  }

  @Get("/get/story-content-list/csv/:commaSeparatedIDList")
  @ApiOperation({ summary: "Get story content list by comma-separated ID list." })
  @ApiParam({ name: "commaSeparatedIDList", description: "CSV ID list", example: "1,2,3", type: String })
  async getStoryContentListCsv(@Param("commaSeparatedIDList") commaSeparatedIDList: string) {
    const list = await this.storyService.getStoryContentListByCsv(commaSeparatedIDList);
    return keyedResponse("storyContents", list);
  }

  @Post("/add/story-content")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Add story content." })
  @ApiBody({ type: CreateStoryContentDto })
  async addStoryContent(@Body() raw: unknown) {
    const input = sanitizeStoryContent(parseStoryContentInput(raw));
    const error = validateStoryContent(input);
    if (error) return simpleResponse(false, error);
    const code = await this.storyService.addStoryContent(input);
    return simpleResponse(code === ActionCode.INSERT_SUCCESS, code === ActionCode.INSERT_SUCCESS ? "Added successfully" : "Failed to add");
  }

  @Patch("/update/story-content/:storyContentId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update story content." })
  @ApiParam({ name: "storyContentId", description: "Story Content ID", example: 100, type: Number })
  @ApiBody({ type: UpdateStoryContentDto })
  async updateStoryContent(@Param("storyContentId") storyContentId: string, @Body() raw: unknown) {
    const input = sanitizeStoryContent(parseStoryContentInput(raw));
    const error = validateStoryContent(input);
    if (error) return simpleResponse(false, error);
    const code = await this.storyService.updateStoryContent(BigInt(storyContentId), input);
    return simpleResponse(code === ActionCode.UPDATE_SUCCESS, code === ActionCode.UPDATE_SUCCESS ? "Updated successfully" : "Failed to update");
  }

  @Delete("/delete/story-content/:storyContentId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete story content." })
  @ApiParam({ name: "storyContentId", description: "Story Content ID", example: 100, type: Number })
  async deleteStoryContent(@Param("storyContentId") storyContentId: string) {
    const code = await this.storyService.deleteStoryContent(BigInt(storyContentId));
    return simpleResponse(code === ActionCode.DELETE_SUCCESS, "Deleted successfully");
  }

  @Post("/add/story-content-section")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Add story content section." })
  @ApiBody({ type: CreateStorySectionDto })
  async addStoryContentSection(@Body() raw: unknown) {
    const input = sanitizeStoryContentSection(parseStoryContentSectionInput(raw));
    const error = validateStoryContentSection(input);
    if (error) return simpleResponse(false, error);
    const code = await this.storyService.addStoryContentSection(input);
    return simpleResponse(code === ActionCode.INSERT_SUCCESS, code === ActionCode.INSERT_SUCCESS ? "Added successfully" : "Failed to add");
  }

  @Patch("/update/story-content-section/:storyContentSectionId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update story content section." })
  @ApiParam({ name: "storyContentSectionId", description: "Section ID", example: 1, type: Number })
  @ApiBody({ type: CreateStorySectionDto })
  async updateStoryContentSection(@Param("storyContentSectionId") storyContentSectionId: string, @Body() raw: unknown) {
    const input = sanitizeStoryContentSection(parseStoryContentSectionInput(raw));
    const error = validateStoryContentSection(input);
    if (error) return simpleResponse(false, error);
    const code = await this.storyService.updateStoryContentSection(BigInt(storyContentSectionId), input);
    return simpleResponse(code === ActionCode.UPDATE_SUCCESS, code === ActionCode.UPDATE_SUCCESS ? "Updated successfully" : "Failed to update");
  }

  @Delete("/delete/story-content-section/:storyContentSectionId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete story content section." })
  @ApiParam({ name: "storyContentSectionId", description: "Section ID", example: 1, type: Number })
  async deleteStoryContentSection(@Param("storyContentSectionId") storyContentSectionId: string) {
    const code = await this.storyService.deleteStoryContentSection(BigInt(storyContentSectionId));
    return simpleResponse(code === ActionCode.DELETE_SUCCESS, "Deleted successfully");
  }

  @Get("/get/story/related/product/:productId")
  @ApiOperation({ summary: "Get story related to product." })
  @ApiParam({ name: "productId", description: "Product ID", example: 156298614, type: Number })
  async getStoryRelatedToProduct(@Param("productId") productId: string) {
    const list = await this.storyService.getStoryRelatedToProduct(BigInt(productId));
    return keyedResponse("storyProductMappings", list);
  }

  @Get("/get/product/related/story/:storyContentId")
  @ApiOperation({ summary: "Get products related to story." })
  @ApiParam({ name: "storyContentId", description: "Story Content ID", example: 100, type: Number })
  async getProductsRelatedToStory(@Param("storyContentId") storyContentId: string) {
    const list = await this.storyService.getProductsRelatedToStory(BigInt(storyContentId));
    return keyedResponse("storyProductMappings", list);
  }

  @Get("/get/story/products/:storyContentId")
  @ApiOperation({ summary: "Get products for story." })
  @ApiParam({ name: "storyContentId", description: "Story Content ID", example: 100, type: Number })
  async getStoryProducts(@Param("storyContentId") storyContentId: string) {
    const list = await this.storyService.getProductsRelatedToStory(BigInt(storyContentId));
    return keyedResponse("products", list);
  }

  @Get("/get/story/product-previews/:storyContentId")
  @ApiOperation({ summary: "Get product previews for story." })
  @ApiParam({ name: "storyContentId", description: "Story Content ID", example: 100, type: Number })
  async getStoryProductPreviews(@Param("storyContentId") storyContentId: string) {
    const list = await this.storyService.getStoryProductPreviews(BigInt(storyContentId));
    return keyedResponse("productPreviews", list);
  }

  @Post("/add/story-product/relation")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Add story product relation." })
  @ApiBody({ type: CreateStoryProductRelationDto })
  async addStoryProductMapping(@Body() raw: unknown) {
    const input = sanitizeStoryProductMapping(parseStoryProductMappingInput(raw));
    const error = validateStoryProductMapping(input);
    if (error) return simpleResponse(false, error);
    const code = await this.storyService.addStoryProductMapping(input);
    return simpleResponse(code === ActionCode.INSERT_SUCCESS, code === ActionCode.INSERT_SUCCESS ? "Added successfully" : "Failed to add");
  }

  @Patch("/update/story-product/relation")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update story product relation." })
  @ApiBody({ type: CreateStoryProductRelationDto })
  async updateStoryProductMapping(@Body() raw: unknown) {
    const input = sanitizeStoryProductMapping(parseStoryProductMappingInput(raw));
    const error = validateStoryProductMapping(input);
    if (error) return simpleResponse(false, error);
    const code = await this.storyService.updateStoryProductMapping(input);
    return simpleResponse(code === ActionCode.UPDATE_SUCCESS, code === ActionCode.UPDATE_SUCCESS ? "Updated successfully" : "Failed to update");
  }

  // Table Explorer Data Endpoints
  @Get("/get/table-explorer/data/story-content")
  async getTableExplorerStoryContent() {
    const list = await this.storyService.getStoryContentList();
    return keyedResponse("records", list);
  }

  @Get("/get/table-explorer/data/story-content-section")
  async getTableExplorerStoryContentSection() {
    return keyedResponse("records", []);
  }

  @Get("/get/table-explorer/data/story-content-category")
  async getTableExplorerStoryContentCategory() {
    const list = await this.storyService.getStoryContentCategories();
    return keyedResponse("records", list);
  }

  @Get("/get/table-explorer/data/story-product-mapping")
  async getTableExplorerStoryProductMapping() {
    return keyedResponse("records", []);
  }
}
