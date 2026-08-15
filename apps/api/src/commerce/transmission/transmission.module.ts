import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { TransmissionController } from "./transmission.controller.js";
import { TrackingController } from "./tracking.controller.js";
import { TransmissionService } from "./transmission.service.js";

@Module({
  imports: [AuthModule],
  controllers: [TransmissionController, TrackingController],
  providers: [TransmissionService],
  exports: [TransmissionService],
})
export class TransmissionModule {}
