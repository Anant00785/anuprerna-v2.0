import { Module } from "@nestjs/common";
import { BloomsightController } from "./bloomsight.controller.js";
import { BloomsightService } from "./bloomsight.service.js";

@Module({
  controllers: [BloomsightController],
  providers: [BloomsightService],
  exports: [BloomsightService],
})
export class BloomsightModule {}
