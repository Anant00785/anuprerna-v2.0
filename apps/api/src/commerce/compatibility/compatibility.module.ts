import { Module } from "@nestjs/common";
import { CompatibilityController } from "./compatibility.controller.js";
import { CompatibilityService } from "./compatibility.service.js";

@Module({
  controllers: [CompatibilityController],
  providers: [CompatibilityService],
  exports: [CompatibilityService],
})
export class CompatibilityModule {}
