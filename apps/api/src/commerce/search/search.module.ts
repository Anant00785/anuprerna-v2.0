// @ts-nocheck
/**
 * apps/api/src/commerce/search/search.module.ts
 *
 * Wires the Search feature using the LOOM-style controller from controller/.
 * Routes: GET /get/search/result/:keyword, GET /get/v2/search/result/:keyword,
 *         GET /search/ai/:keyword (stub), GET /reindex (admin)
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { SearchController } from "./controller/search.controller.js";
import { SearchService } from "./service/search.service.js";
import { SearchRepository } from "./repository/search.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [SearchController],
  providers: [SearchService, SearchRepository],
  exports: [SearchService],
})
export class SearchModule {}
