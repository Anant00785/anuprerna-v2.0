import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { CompatibilityController } from "./compatibility.controller.js";
import { CompatibilityService } from "./compatibility.service.js";

@Module({
  imports: [AuthModule],
  controllers: [CompatibilityController],
  providers: [CompatibilityService],
  exports: [CompatibilityService],
})
export class CompatibilityModule {}
