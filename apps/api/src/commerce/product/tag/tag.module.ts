/**
 * apps/api/src/catalog/product/tag/tag.module.ts
 *
 * Wires the Tag feature together. DatabaseModule is @Global() (see
 * database/database.module.ts), so DATABASE_CONNECTION doesn't need to be
 * re-imported here — TagRepository injects it directly, same as every
 * other module in this project.
 *
 * TagController (product/controller/tag.controller.ts) is wired here. Its
 * route paths were inferred rather than read off RequestMapper.java — see
 * that file's header. Every route on it is @RequireGate'd (CODE_SUCU for the
 * two list reads, CODE_SU for the rest) under a class-level RolesGuard, so
 * nothing here is anonymously reachable.
 *
 * TagService is exported (not just provided) so a future ProductModule /
 * CatalogModule composition root can import TagModule and inject
 * TagService without re-declaring TagRepository.
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../../auth/auth.module.js";
import { TagController } from "../controller/tag.controller.js";
import { TagService } from "./service/tag.service.js";
import { TagRepository } from "./repository/tag.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [TagController],
  providers: [TagService, TagRepository],
  exports: [TagService],
})
export class TagModule {}
