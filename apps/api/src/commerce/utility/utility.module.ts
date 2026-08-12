import { Module } from "@nestjs/common";
import { UtilityController } from "./utility.controller.js";
import { UtilityService } from "./utility.service.js";

@Module({
  controllers: [UtilityController],
  providers: [UtilityService],
  exports: [UtilityService],
})
export class UtilityModule {}

