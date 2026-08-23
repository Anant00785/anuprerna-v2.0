// @ts-nocheck
/**
 * apps/api/src/catalog/product/tag/tag.module.ts
 *
 * Wires the Tag feature together. DatabaseModule is @Global() (see
 * database/database.module.ts), so DATABASE_CONNECTION doesn't need to be
 * re-imported here — TagRepository injects it directly, same as every
 * other module in this project.
 *
 * NO CONTROLLER IS WIRED HERE YET. TagController depends on
 * `com.bloomscorp.loom.support.RequestMapper` (route path constants), which
 * has not been provided. Per the migration brief, controller generation is
 * deferred — this module currently exports TagService only, ready to be
 * consumed by:
 *   1. TagController, once RequestMapper.java is available (adds a
 *      `controllers: [TagController]` line here).
 *   2. Other product sub-domains that reference tags (none confirmed yet
 *      from the files migrated so far).
 *
 * TagService is exported (not just provided) so a future ProductModule /
 * CatalogModule composition root can import TagModule and inject
 * TagService without re-declaring TagRepository.
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../../auth/auth.module.js";
import { TagService } from "./service/tag.service.js";
import { TagRepository } from "./repository/tag.repository.js";

@Module({
  imports: [AuthModule],
  providers: [TagService, TagRepository],
  exports: [TagService],
})
export class TagModule {}
// @ts-nocheck
