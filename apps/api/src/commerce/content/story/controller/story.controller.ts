import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RolesGuard, RequireGate } from "../../../../common/auth/roles.guard.js";
import { GateCode } from "../../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../../common/response/rain-response.js";
import { StoryService } from "../service/story.service.js";
import { parseStoryContentCategoryInput, parseStoryContentInput, parseStoryContentSectionInput, parseStoryProductMappingInput } from "../types/story.types.js";
import { validateStoryContentCategory, validateStoryContent, validateStoryContentSection, validateStoryProductMapping, sanitizeStoryContentCategory, sanitizeStoryContent, sanitizeStoryContentSection, sanitizeStoryProductMapping } from "../validator/story.validator.js";
import { ActionCode } from "../../../../common/errors/action-code.js";

@Controller()
@ApiTags("Content")
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Get("/get/story-content-category-list")
  @RequireGate(GateCode.CODE_SU)
  async getStoryContentCategoryList() {
    const list = await this.storyService.getStoryContentCategories();
    return keyedResponse("storyContentCategories", list);
  }

  @Post("/add/story-content-category")
  @RequireGate(GateCode.CODE_SU)
  async addStoryContentCategory(@Body() raw: unknown) {
    const input = sanitizeStoryContentCategory(parseStoryContentCategoryInput(raw));
    const error = validateStoryContentCategory(input);
    if (error) return simpleResponse(false, error);
    const code = await this.storyService.addStoryContentCategory(input);
    return simpleResponse(code === ActionCode.INSERT_SUCCESS, code === ActionCode.INSERT_SUCCESS ? "Added successfully" : "Failed to add");
  }

  @Patch("/update/story-content-category")
  @RequireGate(GateCode.CODE_SU)
  async updateStoryContentCategory(@Body() raw: unknown) {
    const input = sanitizeStoryContentCategory(parseStoryContentCategoryInput(raw));
    const error = validateStoryContentCategory(input);
    if (error) return simpleResponse(false, error);
    const code = await this.storyService.updateStoryContentCategory(input);
    return simpleResponse(code === ActionCode.UPDATE_SUCCESS, code === ActionCode.UPDATE_SUCCESS ? "Updated successfully" : "Failed to update");
  }

  @Get("/get/story-content-list")
  @RequireGate(GateCode.CODE_SUCU)
  async getStoryContentList() {
    const list = await this.storyService.getStoryContentList();
    return keyedResponse("storyContents", list);
  }

  @Get("/get/story-content/:storyContentId")
  @RequireGate(GateCode.CODE_SUCU)
  async getStoryContent(@Param("storyContentId") storyContentId: string) {
    const story = await this.storyService.getStoryContentById(BigInt(storyContentId));
    return keyedResponse("storyContent", story);
  }

  @Get("/get/story-content/slug/:slug")
  async getStoryContentBySlug(@Param("slug") slug: string) {
    const story = await this.storyService.getStoryContentBySlug(slug);
    return keyedResponse("storyContent", story);
  }

  @Get("/get/stories/:storyId/recommended")
  async getRecommendedStories(@Param("storyId") storyId: string) {
    const list = await this.storyService.getStoryContentList();
    return keyedResponse("storyContents", list.slice(0, 5));
  }

  @Get("/get/stories/category/:storyCategoryId")
  async getStoriesByCategory(@Param("storyCategoryId") storyCategoryId: string) {
    const list = await this.storyService.getStoriesByCategory(BigInt(storyCategoryId));
    return keyedResponse("storyContents", list);
  }

  @Get("/get/story-content-list/csv/:commaSeparatedIDList")
  async getStoryContentListCsv(@Param("commaSeparatedIDList") commaSeparatedIDList: string) {
    const list = await this.storyService.getStoryContentListByCsv(commaSeparatedIDList);
    return keyedResponse("storyContents", list);
  }

  @Post("/add/story-content")
  @RequireGate(GateCode.CODE_SU)
  async addStoryContent(@Body() raw: unknown) {
    const input = sanitizeStoryContent(parseStoryContentInput(raw));
    const error = validateStoryContent(input);
    if (error) return simpleResponse(false, error);
    const code = await this.storyService.addStoryContent(input);
    return simpleResponse(code === ActionCode.INSERT_SUCCESS, code === ActionCode.INSERT_SUCCESS ? "Added successfully" : "Failed to add");
  }

  @Patch("/update/story-content/:storyContentId")
  @RequireGate(GateCode.CODE_SU)
  async updateStoryContent(@Param("storyContentId") storyContentId: string, @Body() raw: unknown) {
    const input = sanitizeStoryContent(parseStoryContentInput(raw));
    const error = validateStoryContent(input);
    if (error) return simpleResponse(false, error);
    const code = await this.storyService.updateStoryContent(BigInt(storyContentId), input);
    return simpleResponse(code === ActionCode.UPDATE_SUCCESS, code === ActionCode.UPDATE_SUCCESS ? "Updated successfully" : "Failed to update");
  }

  @Delete("/delete/story-content/:storyContentId")
  @RequireGate(GateCode.CODE_SU)
  async deleteStoryContent(@Param("storyContentId") storyContentId: string) {
    const code = await this.storyService.deleteStoryContent(BigInt(storyContentId));
    return simpleResponse(code === ActionCode.DELETE_SUCCESS, "Deleted successfully");
  }

  @Post("/add/story-content-section")
  @RequireGate(GateCode.CODE_SU)
  async addStoryContentSection(@Body() raw: unknown) {
    const input = sanitizeStoryContentSection(parseStoryContentSectionInput(raw));
    const error = validateStoryContentSection(input);
    if (error) return simpleResponse(false, error);
    const code = await this.storyService.addStoryContentSection(input);
    return simpleResponse(code === ActionCode.INSERT_SUCCESS, code === ActionCode.INSERT_SUCCESS ? "Added successfully" : "Failed to add");
  }

  @Patch("/update/story-content-section/:storyContentSectionId")
  @RequireGate(GateCode.CODE_SU)
  async updateStoryContentSection(@Param("storyContentSectionId") storyContentSectionId: string, @Body() raw: unknown) {
    const input = sanitizeStoryContentSection(parseStoryContentSectionInput(raw));
    const error = validateStoryContentSection(input);
    if (error) return simpleResponse(false, error);
    const code = await this.storyService.updateStoryContentSection(BigInt(storyContentSectionId), input);
    return simpleResponse(code === ActionCode.UPDATE_SUCCESS, code === ActionCode.UPDATE_SUCCESS ? "Updated successfully" : "Failed to update");
  }

  @Delete("/delete/story-content-section/:storyContentSectionId")
  @RequireGate(GateCode.CODE_SU)
  async deleteStoryContentSection(@Param("storyContentSectionId") storyContentSectionId: string) {
    const code = await this.storyService.deleteStoryContentSection(BigInt(storyContentSectionId));
    return simpleResponse(code === ActionCode.DELETE_SUCCESS, "Deleted successfully");
  }

  @Get("/get/story/related/product/:productId")
  async getStoryRelatedToProduct(@Param("productId") productId: string) {
    const list = await this.storyService.getStoryRelatedToProduct(BigInt(productId));
    return keyedResponse("storyProductMappings", list);
  }

  @Get("/get/product/related/story/:storyContentId")
  async getProductsRelatedToStory(@Param("storyContentId") storyContentId: string) {
    const list = await this.storyService.getProductsRelatedToStory(BigInt(storyContentId));
    return keyedResponse("storyProductMappings", list);
  }

  @Get("/get/story/products/:storyContentId")
  @RequireGate(GateCode.CODE_SUCU)
  async getStoryProducts(@Param("storyContentId") storyContentId: string) {
    const list = await this.storyService.getProductsRelatedToStory(BigInt(storyContentId));
    return keyedResponse("products", list);
  }

  @Get("/get/story/product-previews/:storyContentId")
  async getStoryProductPreviews(@Param("storyContentId") storyContentId: string) {
    const list = await this.storyService.getStoryProductPreviews(BigInt(storyContentId));
    return keyedResponse("productPreviews", list);
  }

  @Post("/add/story-product/relation")
  @RequireGate(GateCode.CODE_SU)
  async addStoryProductMapping(@Body() raw: unknown) {
    const input = sanitizeStoryProductMapping(parseStoryProductMappingInput(raw));
    const error = validateStoryProductMapping(input);
    if (error) return simpleResponse(false, error);
    const code = await this.storyService.addStoryProductMapping(input);
    return simpleResponse(code === ActionCode.INSERT_SUCCESS, code === ActionCode.INSERT_SUCCESS ? "Added successfully" : "Failed to add");
  }

  @Patch("/update/story-product/relation")
  @RequireGate(GateCode.CODE_SU)
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
