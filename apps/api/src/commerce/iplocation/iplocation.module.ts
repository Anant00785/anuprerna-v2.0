import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { IPLocationController } from "./controller/iplocation.controller.js";
import { IPLocationService } from "./service/iplocation.service.js";

@Module({
  imports: [AuthModule],
  controllers: [IPLocationController],
  providers: [IPLocationService],
  exports: [IPLocationService],
})
export class IPLocationModule {}
