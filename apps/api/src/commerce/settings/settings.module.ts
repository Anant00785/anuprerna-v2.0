// @ts-nocheck
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { SettingsController } from "./controller/settings.controller.js";
import { SettingsService } from "./service/settings.service.js";
import { SettingsRepository } from "./repository/settings.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsRepository],
  exports: [SettingsService, SettingsRepository],
})
export class SettingsModule {}
