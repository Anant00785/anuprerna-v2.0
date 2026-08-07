import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { CatalogController } from "./controller/catalog.controller.js";
import { CatalogItemController } from "./controller/catalog-item.controller.js";
import { CatalogItemMediaController } from "./controller/catalog-item-media.controller.js";
import { CatalogPdfController } from "./controller/catalog-pdf.controller.js";
import { CatalogService } from "./service/catalog.service.js";
import { CatalogItemService } from "./service/catalog-item.service.js";
import { CatalogItemMediaService } from "./service/catalog-item-media.service.js";
import { CatalogPdfService } from "./service/catalog-pdf.service.js";
import { CatalogRepository } from "./repository/catalog.repository.js";
import { CatalogItemRepository } from "./repository/catalog-item.repository.js";
import { CatalogItemMediaRepository } from "./repository/catalog-item-media.repository.js";
import { CatalogPdfRepository } from "./repository/catalog-pdf.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [CatalogController, CatalogItemController, CatalogItemMediaController, CatalogPdfController],
  providers: [
    CatalogService, CatalogItemService, CatalogItemMediaService, CatalogPdfService,
    CatalogRepository, CatalogItemRepository, CatalogItemMediaRepository, CatalogPdfRepository
  ],
  exports: [CatalogService, CatalogItemService, CatalogItemMediaService, CatalogPdfService],
})
export class CatalogModule {}
