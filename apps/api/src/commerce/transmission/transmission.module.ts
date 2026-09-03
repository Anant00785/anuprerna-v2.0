import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { TrackingController } from "./tracking.controller.js";
import { TransmissionService } from "./transmission.service.js";
import { TrackingOwnershipService } from "./tracking.service.js";
// Distinct class that happens to share the name: the outbound HTTP client.
import { TransmissionService as HttpTransmissionService } from "./service/transmission.service.js";

@Module({
  imports: [AuthModule],
  controllers: [TrackingController],
  providers: [TransmissionService, HttpTransmissionService, TrackingOwnershipService],
  exports: [TransmissionService, HttpTransmissionService],
})
export class TransmissionModule {}
