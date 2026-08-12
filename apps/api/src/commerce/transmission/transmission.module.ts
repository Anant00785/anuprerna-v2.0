import { Module } from "@nestjs/common";
import { TransmissionController } from "./transmission.controller.js";
import { TrackingController } from "./tracking.controller.js";
import { TransmissionService } from "./transmission.service.js";

@Module({
  controllers: [TransmissionController, TrackingController],
  providers: [TransmissionService],
  exports: [TransmissionService],
})
export class TransmissionModule {}
