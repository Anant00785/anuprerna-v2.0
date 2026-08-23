// @ts-nocheck
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { SitemapController } from "./controller/sitemap.controller.js";
import { SitemapService } from "./service/sitemap.service.js";
import { SitemapRepository } from "./repository/sitemap.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [SitemapController],
  providers: [SitemapService, SitemapRepository],
  exports: [SitemapService, SitemapRepository],
})
export class SitemapModule {}
