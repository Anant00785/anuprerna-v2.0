import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { UtilityController } from "./utility.controller.js";
import { UtilityService } from "./utility.service.js";

@Module({
  imports: [AuthModule],
  controllers: [UtilityController],
  providers: [UtilityService],
  exports: [UtilityService],
})
export class UtilityModule {}

