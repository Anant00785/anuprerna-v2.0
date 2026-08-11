// @ts-nocheck
/**
 * apps/api/src/commerce/catalog/catalog.module.ts
 *
 * Wires the Catalog feature using LOOM-style controllers.
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { CatalogController } from "./controller/catalog.controller.js";
import { CatalogItemController } from "./controller/catalog-item.controller.js";
import { CatalogPdfController } from "./controller/catalog-pdf.controller.js";
import { CatalogItemMediaController } from "./controller/catalog-item-media.controller.js";

import { CatalogService } from "./service/catalog.service.js";
import { CatalogRepository } from "./repository/catalog.repository.js";
import { CatalogItemService } from "./service/catalog-item.service.js";
import { CatalogItemRepository } from "./repository/catalog-item.repository.js";
import { CatalogPdfService } from "./service/catalog-pdf.service.js";
import { CatalogPdfRepository } from "./repository/catalog-pdf.repository.js";
import { CatalogItemMediaService } from "./service/catalog-item-media.service.js";
import { CatalogItemMediaRepository } from "./repository/catalog-item-media.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [
    CatalogController,
    CatalogItemController,
    CatalogPdfController,
    CatalogItemMediaController,
  ],
  providers: [
    CatalogService,
    CatalogRepository,
    CatalogItemService,
    CatalogItemRepository,
    CatalogPdfService,
    CatalogPdfRepository,
    CatalogItemMediaService,
    CatalogItemMediaRepository,
  ],
  exports: [
    CatalogService,
    CatalogItemService,
    CatalogPdfService,
    CatalogItemMediaService,
  ],
})
export class CatalogModule {}
