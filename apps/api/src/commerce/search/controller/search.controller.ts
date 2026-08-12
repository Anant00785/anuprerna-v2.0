import { Controller, Get, Param, UseGuards, HttpException, HttpStatus } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { SearchService } from "../service/search.service.js";
import { validateSearchTerm } from "../validators/search.validator.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";

@Controller()
@ApiTags("Search")
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get("/get/search/result/:keyword")
  async searchProduct(@Param("keyword") keyword: string) {
    const error = validateSearchTerm(keyword);
    if (error) {
      return simpleResponse(false, error); // or matching failure response
    }

    try {
      const results = await this.searchService.searchProduct(keyword);
      return keyedResponse("entityList", results);
    } catch (error) {
      console.warn("Search query failed; returning an empty result.", error);
      return keyedResponse("entityList", []);
    }
  }

  @Get("/get/v2/search/result/:keyword")
  async searchProductV2(@Param("keyword") keyword: string) {
    const error = validateSearchTerm(keyword);
    if (error) {
      return simpleResponse(false, error);
    }

    const result = await this.searchService.searchProductV2(keyword);
    return keyedResponse("entity", result);
  }

  @Get("/reindex")
  @RequireGate(GateCode.CODE_SU)
  async runLuceneReindexing() {
    // No-op for Lucene reindexing in NestJS
    return simpleResponse(true, "Reindexing successful");
  }

  // --- AI Stub Endpoints ---

  @Get("/search/ai/:keyword")
  async aiSearch(@Param("keyword") keyword: string) {
    throw new HttpException("Not Implemented", HttpStatus.NOT_IMPLEMENTED);
  }

  @Get("/search/ai/blog/:keyword")
  async aiBlogSearch(@Param("keyword") keyword: string) {
    throw new HttpException("Not Implemented", HttpStatus.NOT_IMPLEMENTED);
  }

  @Get("/search/ai/story/:keyword")
  async aiStorySearch(@Param("keyword") keyword: string) {
    throw new HttpException("Not Implemented", HttpStatus.NOT_IMPLEMENTED);
  }

  @Get("/reindex/vector")
  @RequireGate(GateCode.CODE_SU)
  async reindexVector() {
    throw new HttpException("Not Implemented", HttpStatus.NOT_IMPLEMENTED);
  }

  @Get("/reindex/vector/blog")
  @RequireGate(GateCode.CODE_SU)
  async reindexBlogVector() {
    throw new HttpException("Not Implemented", HttpStatus.NOT_IMPLEMENTED);
  }

  @Get("/reindex/vector/story")
  @RequireGate(GateCode.CODE_SU)
  async reindexStoryVector() {
    throw new HttpException("Not Implemented", HttpStatus.NOT_IMPLEMENTED);
  }
}
// @ts-nocheck
