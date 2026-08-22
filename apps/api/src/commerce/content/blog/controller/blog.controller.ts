// @ts-nocheck
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RolesGuard, RequireGate } from "../../../../common/auth/roles.guard.js";
import { GateCode } from "../../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../../common/response/rain-response.js";
import { BlogService } from "../service/blog.service.js";
import { parseBlogContentTypeInput, parseBlogContentCategoryInput, parseBlogContentInput, parseBlogContentSectionInput } from "../types/blog.types.js";
import { validateBlogContentType, validateBlogContentCategory, validateBlogContent, validateBlogContentSection, sanitizeBlogContentType, sanitizeBlogContentCategory, sanitizeBlogContent, sanitizeBlogContentSection } from "../validator/blog.validator.js";
import { ActionCode } from "../../../../common/errors/action-code.js";
import { 
  CreateBlogTypeDto, 
  UpdateBlogTypeDto, 
  CreateBlogCategoryDto, 
  UpdateBlogCategoryDto, 
  CreateBlogContentDto, 
  UpdateBlogContentDto, 
  CreateBlogSectionDto, 
  UpdateBlogSectionDto 
} from "../dto/blog.dto.js";

@Controller()
@ApiTags("Blog")
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get("/get/blog-content-types")
  @ApiOperation({ summary: "Get blog content types." })
  async getBlogContentTypes() {
    const list = await this.blogService.getBlogContentTypes();
    return keyedResponse("blogContentTypes", list);
  }

  @Post("/add/blog-content-type")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Add a new blog content type." })
  @ApiBody({ type: CreateBlogTypeDto })
  @ApiResponse({ status: 201, description: "Blog content type created." })
  async addBlogContentType(@Body() raw: CreateBlogTypeDto) {
    const input = sanitizeBlogContentType(parseBlogContentTypeInput(raw));
    const error = validateBlogContentType(input);
    if (error) return simpleResponse(false, error);
    const code = await this.blogService.addBlogContentType(input);
    return simpleResponse(code === ActionCode.INSERT_SUCCESS, code === ActionCode.INSERT_SUCCESS ? "Added successfully" : "Failed to add");
  }

  @Patch("/update/blog-content-type")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update blog content type details." })
  @ApiBody({ type: UpdateBlogTypeDto })
  @ApiResponse({ status: 200, description: "Blog content type updated." })
  async updateBlogContentType(@Body() raw: UpdateBlogTypeDto) {
    const input = sanitizeBlogContentType(parseBlogContentTypeInput(raw));
    const error = validateBlogContentType(input);
    if (error) return simpleResponse(false, error);
    const code = await this.blogService.updateBlogContentType(input);
    return simpleResponse(code === ActionCode.UPDATE_SUCCESS, code === ActionCode.UPDATE_SUCCESS ? "Updated successfully" : "Failed to update");
  }

  @Get("/get/blog-content-category-list")
  @ApiOperation({ summary: "Get blog content category list." })
  @ApiResponse({ status: 200, description: "List of blog categories." })
  async getBlogContentCategoryList() {
    const list = await this.blogService.getBlogContentCategories();
    return keyedResponse("blogContentCategories", list);
  }

  @Post("/add/blog-content-category/:blogContentTypeId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Add a new blog content category." })
  @ApiParam({ name: "blogContentTypeId", description: "Content Type unique identifier", example: 107236, type: Number })
  @ApiBody({ type: CreateBlogCategoryDto })
  @ApiResponse({ status: 201, description: "Blog category created." })
  async addBlogContentCategory(@Param("blogContentTypeId") blogContentTypeId: string, @Body() raw: CreateBlogCategoryDto) {
    const input = sanitizeBlogContentCategory(parseBlogContentCategoryInput({ ...raw, blogContentTypeId }));
    const error = validateBlogContentCategory(input);
    if (error) return simpleResponse(false, error);
    const code = await this.blogService.addBlogContentCategory(BigInt(blogContentTypeId), input);
    return simpleResponse(code === ActionCode.INSERT_SUCCESS, code === ActionCode.INSERT_SUCCESS ? "Added successfully" : "Failed to add");
  }

  @Patch("/update/blog-content-category")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update blog content category." })
  @ApiBody({ type: UpdateBlogCategoryDto })
  @ApiResponse({ status: 200, description: "Blog category updated." })
  async updateBlogContentCategory(@Body() raw: UpdateBlogCategoryDto) {
    const input = sanitizeBlogContentCategory(parseBlogContentCategoryInput(raw));
    const error = validateBlogContentCategory(input);
    if (error) return simpleResponse(false, error);
    const code = await this.blogService.updateBlogContentCategory(input);
    return simpleResponse(code === ActionCode.UPDATE_SUCCESS, code === ActionCode.UPDATE_SUCCESS ? "Updated successfully" : "Failed to update");
  }

  @Get("/get/blog-content-list")
  @ApiOperation({ summary: "Get blog content list (admin)." })
  @ApiResponse({ status: 200, description: "List of blog contents." })
  async getBlogContentList() {
    const list = await this.blogService.getBlogContentList();
    return keyedResponse("blogContents", list);
  }

  @Get("/get/blog-content-list/customer")
  @ApiOperation({ summary: "Get blog content list for customer." })
  @ApiResponse({ status: 200, description: "List of public blog contents." })
  async getCustomerBlogContentList() {
    const list = await this.blogService.getBlogContentList();
    return keyedResponse("blogContents", list);
  }

  @Get("/get/blogs/:blogId/recommended")
  @ApiOperation({ summary: "Get recommended blogs for a specific blog." })
  @ApiParam({ name: "blogId", description: "Blog ID", example: 100, type: Number })
  @ApiResponse({ status: 200, description: "List of recommended blogs." })
  async getRecommendedBlogs(@Param("blogId") blogId: string) {
    const list = await this.blogService.getRecommendedBlogs(BigInt(blogId));
    return keyedResponse("blogContents", list);
  }

  @Get("/get/blogs/category/:blogCategoryId")
  @ApiOperation({ summary: "Get blogs by category ID." })
  @ApiParam({ name: "blogCategoryId", description: "Category ID", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "List of blogs in category." })
  async getBlogsByCategory(@Param("blogCategoryId") blogCategoryId: string) {
    const list = await this.blogService.getBlogsByCategory(BigInt(blogCategoryId));
    return keyedResponse("blogContents", list);
  }

  @Get("/get/blog-content/:blogContentId")
  @ApiOperation({ summary: "Get blog content by ID." })
  @ApiParam({ name: "blogContentId", description: "Blog Content ID", example: 100, type: Number })
  @ApiResponse({ status: 200, description: "Blog content details." })
  async getBlogContent(@Param("blogContentId") blogContentId: string) {
    const blog = await this.blogService.getBlogContentById(BigInt(blogContentId));
    return keyedResponse("blogContent", blog);
  }

  @Get("/get/blog-content/slug/:slug")
  @ApiOperation({ summary: "Get blog content by slug." })
  @ApiParam({ name: "slug", description: "SEO Slug", example: "10-reasons-organic-cotton-is-better", type: String })
  @ApiResponse({ status: 200, description: "Blog content by slug." })
  async getBlogContentBySlug(@Param("slug") slug: string) {
    const blog = await this.blogService.getBlogContentBySlug(slug);
    return keyedResponse("blogContent", blog);
  }

  @Get("/get/blog-content-list/csv/:commaSeparatedIDList")
  @ApiOperation({ summary: "Get blog content list by CSV ID string." })
  @ApiParam({ name: "commaSeparatedIDList", description: "CSV IDs", example: "1,2,3", type: String })
  @ApiResponse({ status: 200, description: "List of blog contents matching IDs." })
  async getBlogContentListCsv(@Param("commaSeparatedIDList") commaSeparatedIDList: string) {
    const list = await this.blogService.getBlogContentListByCsv(commaSeparatedIDList);
    return keyedResponse("blogContents", list);
  }

  @Post("/add/blog-content")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Add new blog content." })
  @ApiBody({ type: CreateBlogContentDto })
  @ApiResponse({ status: 201, description: "Blog content created." })
  async addBlogContent(@Body() raw: CreateBlogContentDto) {
    const input = sanitizeBlogContent(parseBlogContentInput(raw));
    const error = validateBlogContent(input);
    if (error) return simpleResponse(false, error);
    const code = await this.blogService.addBlogContent(input);
    return simpleResponse(code === ActionCode.INSERT_SUCCESS, code === ActionCode.INSERT_SUCCESS ? "Added successfully" : "Failed to add");
  }

  @Patch("/update/blog-content/:blogContentId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update blog content." })
  @ApiParam({ name: "blogContentId", description: "Blog Content ID", example: 100, type: Number })
  @ApiBody({ type: UpdateBlogContentDto })
  @ApiResponse({ status: 200, description: "Blog content updated." })
  async updateBlogContent(@Param("blogContentId") blogContentId: string, @Body() raw: UpdateBlogContentDto) {
    const input = sanitizeBlogContent(parseBlogContentInput(raw));
    const error = validateBlogContent(input);
    if (error) return simpleResponse(false, error);
    const code = await this.blogService.updateBlogContent(BigInt(blogContentId), input);
    return simpleResponse(code === ActionCode.UPDATE_SUCCESS, code === ActionCode.UPDATE_SUCCESS ? "Updated successfully" : "Failed to update");
  }

  @Delete("/delete/blog-content/:blogContentId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete blog content." })
  @ApiParam({ name: "blogContentId", description: "Blog Content ID", example: 100, type: Number })
  @ApiResponse({ status: 200, description: "Blog content deleted." })
  async deleteBlogContent(@Param("blogContentId") blogContentId: string) {
    const code = await this.blogService.deleteBlogContent(BigInt(blogContentId));
    return simpleResponse(code === ActionCode.DELETE_SUCCESS, "Deleted successfully");
  }

  @Post("/add/blog-content-section")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Add blog content section." })
  @ApiBody({ type: CreateBlogSectionDto })
  @ApiResponse({ status: 201, description: "Blog section created." })
  async addBlogContentSection(@Body() raw: CreateBlogSectionDto) {
    const input = sanitizeBlogContentSection(parseBlogContentSectionInput(raw));
    const error = validateBlogContentSection(input);
    if (error) return simpleResponse(false, error);
    const code = await this.blogService.addBlogContentSection(input);
    return simpleResponse(code === ActionCode.INSERT_SUCCESS, code === ActionCode.INSERT_SUCCESS ? "Added successfully" : "Failed to add");
  }

  @Patch("/update/blog-content-section/:blogContentSectionId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update blog content section." })
  @ApiParam({ name: "blogContentSectionId", description: "Section ID", example: 1, type: Number })
  @ApiBody({ type: UpdateBlogSectionDto })
  @ApiResponse({ status: 200, description: "Blog section updated." })
  async updateBlogContentSection(@Param("blogContentSectionId") blogContentSectionId: string, @Body() raw: UpdateBlogSectionDto) {
    const input = sanitizeBlogContentSection(parseBlogContentSectionInput(raw));
    const error = validateBlogContentSection(input);
    if (error) return simpleResponse(false, error);
    const code = await this.blogService.updateBlogContentSection(BigInt(blogContentSectionId), input);
    return simpleResponse(code === ActionCode.UPDATE_SUCCESS, code === ActionCode.UPDATE_SUCCESS ? "Updated successfully" : "Failed to update");
  }

  @Delete("/delete/blog-content-section/:blogContentSectionId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete blog content section." })
  @ApiParam({ name: "blogContentSectionId", description: "Section ID", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Blog section deleted." })
  async deleteBlogContentSection(@Param("blogContentSectionId") blogContentSectionId: string) {
    const code = await this.blogService.deleteBlogContentSection(BigInt(blogContentSectionId));
    return simpleResponse(code === ActionCode.DELETE_SUCCESS, "Deleted successfully");
  }

  // Table Explorer Data Endpoints
  @Get("/get/table-explorer/data/blog-content")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Get blog content table explorer data." })
  async getTableExplorerBlogContent() {
    const list = await this.blogService.getBlogContentList();
    return keyedResponse("records", list);
  }

  @Get("/get/table-explorer/data/blog-content-section")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Get blog content section table explorer data." })
  async getTableExplorerBlogContentSection() {
    const list = await this.blogService.getAllBlogContentSections();
    return keyedResponse("records", list);
  }

  @Get("/get/table-explorer/data/blog-content-category")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Get blog content category table explorer data." })
  async getTableExplorerBlogContentCategory() {
    const list = await this.blogService.getBlogContentCategories();
    return keyedResponse("records", list);
  }

  @Get("/get/table-explorer/data/blog-content-type")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Get blog content type table explorer data." })
  async getTableExplorerBlogContentType() {
    const list = await this.blogService.getBlogContentTypes();
    return keyedResponse("records", list);
  }
}
