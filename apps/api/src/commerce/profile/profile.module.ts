/**
 * apps/api/src/commerce/profile/profile.module.ts
 *
 * Providers (ProfileService/ProfileRepository) so the Product, FabricProduct
 * and FinishedProduct modules can bind their badge / made-to-order /
 * size-profile ports to the real Profile domain, plus the three profile
 * controllers.
 *
 * The badge / size / made-to-order routes have Java originals in
 * loom RequestMapper (GET_BADGE_PROFILE_LIST, GET_SIZE_PROFILE_LIST,
 * GET_MADE_TO_ORDER_PROFILE_LIST and friends) and live CMS callers, and no
 * other registered controller serves them — they were simply never wired up.
 * `tenant-profile.controller.ts` was deleted instead: all five of its routes
 * are served by commerce/tenant/controller/tenant.controller.ts.
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { ProfileService } from "./service/profile.service.js";
import { ProfileRepository } from "./repository/profile.repository.js";
import { BadgeProfileController } from "./controller/badge-profile.controller.js";
import { MadeToOrderProfileController } from "./controller/made-to-order-profile.controller.js";
import { SizeProfileController } from "./controller/size-profile.controller.js";

@Module({
  imports: [AuthModule],
  controllers: [BadgeProfileController, MadeToOrderProfileController, SizeProfileController],
  providers: [ProfileService, ProfileRepository],
  exports: [ProfileService, ProfileRepository],
})
export class ProfileModule {}
