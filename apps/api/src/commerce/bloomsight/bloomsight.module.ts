import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { BloomsightController } from "./bloomsight.controller.js";
import { BloomsightService } from "./bloomsight.service.js";

@Module({
  imports: [AuthModule],
  controllers: [BloomsightController],
  providers: [BloomsightService],
  exports: [BloomsightService],
})
export class BloomsightModule {}
