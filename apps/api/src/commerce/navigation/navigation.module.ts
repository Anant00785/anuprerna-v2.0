// @ts-nocheck
/**
 * apps/api/src/commerce/navigation/navigation.module.ts
 *
 * Wires the Navigation feature using the LOOM-style controller from controller/.
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { NavigationController } from "./controller/navigation.controller.js";
import { NavigationService } from "./service/navigation.service.js";
import { NavigationRepository } from "./repository/navigation.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [NavigationController],
  providers: [NavigationService, NavigationRepository],
  exports: [NavigationService],
})
export class NavigationModule {}
