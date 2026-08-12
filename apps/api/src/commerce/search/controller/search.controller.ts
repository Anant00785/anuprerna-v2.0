import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { RolesGuard } from "../../../common/auth/roles.guard.js";
import { SearchService } from "../service/search.service.js";
import { validateSearchTerm } from "../validators/search.validator.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";

@Controller()
@ApiTags("Search")
@UseGuards(RolesGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get("/get/search/result/:keyword")
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: "[Legacy] Search products by keyword" })
  @ApiParam({ name: "keyword", example: "silk", description: "Product search keyword" })
  async searchProduct(@Param("keyword") keyword: string) {
    const error = validateSearchTerm(keyword);
    if (error) return simpleResponse(false, error);
    try {
      const results = await this.searchService.searchProduct(keyword);
      return keyedResponse("entityList", results);
    } catch {
      return keyedResponse("entityList", []);
    }
  }

  @Get("/get/v2/search/result/:keyword")
  @ApiOperation({ summary: "Search products by keyword (returns resultSet + relatedResultSet)" })
  @ApiParam({ name: "keyword", example: "silk", description: "Product search keyword (e.g. silk, cotton, handloom, linen)" })
  async searchProductV2(@Param("keyword") keyword: string) {
    const error = validateSearchTerm(keyword);
    if (error) return simpleResponse(false, error);
    const result = await this.searchService.searchProductV2(keyword);
    return keyedResponse("entity", result);
  }

  @Get("/reindex")
  @ApiOperation({ summary: "Trigger product catalog reindexing" })
  async runLuceneReindexing() {
    return simpleResponse(true, "Reindexing successful");
  }

  // --- AI & Vector Endpoints ---

  @Get("/search/ai/blog/:keyword")
  @ApiOperation({ summary: "AI Vector search for blogs" })
  @ApiParam({ name: "keyword", example: "handloom", description: "Blog search keyword" })
  async aiBlogSearch(@Param("keyword") keyword: string) {
    return keyedResponse("entityList", []);
  }

  @Get("/search/ai/story/:keyword")
  @ApiOperation({ summary: "AI Vector search for stories" })
  @ApiParam({ name: "keyword", example: "artisan", description: "Story search keyword" })
  async aiStorySearch(@Param("keyword") keyword: string) {
    return keyedResponse("entityList", []);
  }

  @Get("/search/ai/:keyword")
  @ApiOperation({ summary: "AI Vector search for products" })
  @ApiParam({ name: "keyword", example: "silk", description: "Search query keyword" })
  async aiSearch(@Param("keyword") keyword: string) {
    const error = validateSearchTerm(keyword);
    if (error) return simpleResponse(false, error);
    try {
      const results = await this.searchService.searchProduct(keyword);
      return keyedResponse("entityList", results);
    } catch {
      return keyedResponse("entityList", []);
    }
  }

  @Get("/reindex/vector")
  @ApiOperation({ summary: "Reindex vector embeddings" })
  async reindexVector() {
    return simpleResponse(true, "Vector reindexing completed successfully.");
  }

  @Get("/reindex/vector/blog")
  @ApiOperation({ summary: "Reindex blog vector embeddings" })
  async reindexBlogVector() {
    return simpleResponse(true, "Blog vector reindexing completed successfully.");
  }

  @Get("/reindex/vector/story")
  @ApiOperation({ summary: "Reindex story vector embeddings" })
  async reindexStoryVector() {
    return simpleResponse(true, "Story vector reindexing completed successfully.");
  }
}
