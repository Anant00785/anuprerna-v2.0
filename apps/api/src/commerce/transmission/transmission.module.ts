import { Module } from "@nestjs/common";
import { TransmissionController } from "./transmission.controller.js";
import { TransmissionService } from "./transmission.service.js";

@Module({
  controllers: [TransmissionController],
  providers: [TransmissionService],
  exports: [TransmissionService],
})
export class TransmissionModule {}

