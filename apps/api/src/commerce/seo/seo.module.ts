import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { SeoController } from "./controller/seo.controller.js";
import { SeoService } from "./service/seo.service.js";
import { SeoRepository } from "./repository/seo.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [SeoController],
  providers: [SeoService, SeoRepository],
  exports: [SeoService, SeoRepository],
})
export class SeoModule {}
