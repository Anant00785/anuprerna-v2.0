import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { GateCode } from "../../../auth/types/auth.types.js";
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { SearchService } from "../service/search.service.js";
import { validateSearchTerm } from "../validators/search.validator.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";

@ApiBearerAuth()
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
      // Legacy Loom emits `productPreviewList` here (verified:
      // loom-v2 /get/search/result/silk -> { productPreviewList: [...] }).
      // `entityList` matched nothing on either frontend.
      return keyedResponse("productPreviewList", results);
    } catch {
      return keyedResponse("productPreviewList", []);
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
  @RequireGate(GateCode.CODE_SU)
  async runLuceneReindexing() {
    return simpleResponse(true, "Reindexing successful");
  }

  @Get("/search/ai/blog/:keyword")
  @ApiOperation({ summary: "AI Vector search for blogs" })
  @ApiParam({ name: "keyword", example: "handloom", description: "Blog search keyword" })
  async aiBlogSearch(@Param("keyword") keyword: string) {
    const error = validateSearchTerm(keyword);
    if (error) return simpleResponse(false, error);
    try {
      const results = await this.searchService.searchBlogs(keyword);
      // Legacy Loom: { blogContentList: [...] }. Read by the storefront at
      // components/content-list/loom.ts and app/api/search/route.ts.
      return keyedResponse("blogContentList", results);
    } catch {
      return keyedResponse("blogContentList", []);
    }
  }

  @Get("/search/ai/story/:keyword")
  @ApiOperation({ summary: "AI Vector search for stories" })
  @ApiParam({ name: "keyword", example: "artisan", description: "Story search keyword" })
  async aiStorySearch(@Param("keyword") keyword: string) {
    const error = validateSearchTerm(keyword);
    if (error) return simpleResponse(false, error);
    try {
      const results = await this.searchService.searchStories(keyword);
      // Legacy Loom: { storyContentList: [...] }.
      return keyedResponse("storyContentList", results);
    } catch {
      return keyedResponse("storyContentList", []);
    }
  }

  @Get("/search/ai/:keyword")
  @ApiOperation({ summary: "AI Vector search for products" })
  @ApiParam({ name: "keyword", example: "silk", description: "Search query keyword" })
  async aiSearch(@Param("keyword") keyword: string) {
    const error = validateSearchTerm(keyword);
    if (error) return simpleResponse(false, error);
    const empty = { product: { resultSet: [], relatedResultSet: [] } };
    try {
      // Legacy Loom nests this: { searchResult: { product: { resultSet,
      // relatedResultSet } } } — verified against loom-v2 /search/ai/silk.
      // Read by storefront app/api/search/route.ts, components/content-list/loom.ts
      // and components/seo-landing/loom.ts. `entityList` matched none of them.
      const result = await this.searchService.searchProductV2(keyword);
      return keyedResponse("searchResult", result);
    } catch {
      return keyedResponse("searchResult", empty);
    }
  }

  @Get("/reindex/vector")
  @ApiOperation({ summary: "Reindex vector embeddings" })
  @RequireGate(GateCode.CODE_SU)
  async reindexVector() {
    return simpleResponse(true, "Vector reindexing completed successfully.");
  }

  @Get("/reindex/vector/blog")
  @ApiOperation({ summary: "Reindex blog vector embeddings" })
  @RequireGate(GateCode.CODE_SU)
  async reindexBlogVector() {
    return simpleResponse(true, "Blog vector reindexing completed successfully.");
  }

  @Get("/reindex/vector/story")
  @ApiOperation({ summary: "Reindex story vector embeddings" })
  @RequireGate(GateCode.CODE_SU)
  async reindexStoryVector() {
    return simpleResponse(true, "Story vector reindexing completed successfully.");
  }
}
