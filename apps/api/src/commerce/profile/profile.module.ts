// @ts-nocheck
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { BadgeProfileController } from "./controller/badge-profile.controller.js";
import { MadeToOrderProfileController } from "./controller/made-to-order-profile.controller.js";
import { SizeProfileController } from "./controller/size-profile.controller.js";
import { TenantProfileController } from "./controller/tenant-profile.controller.js";
import { ProfileService } from "./profile.service.js";
import { ProfileService } from "./service/profile.service.js";
import { ProfileRepository } from "./repository/profile.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [BadgeProfileController, MadeToOrderProfileController, SizeProfileController, TenantProfileController],
  providers: [ProfileService, ProfileService, ProfileRepository],
  exports: [ProfileService, ProfileService, ProfileRepository],
})
export class ProfileModule {}
