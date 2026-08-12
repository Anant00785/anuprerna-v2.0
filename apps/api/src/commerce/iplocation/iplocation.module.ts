import { Module } from "@nestjs/common";
import { IPLocationController } from "./iplocation.controller.js";
import { IPLocationService } from "./iplocation.service.js";

@Module({
  controllers: [IPLocationController],
  providers: [IPLocationService],
  exports: [IPLocationService],
})
export class IPLocationModule {}

