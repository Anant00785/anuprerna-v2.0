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
