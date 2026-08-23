import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { ZohoAdapterController } from "./zoho_adapter.controller.js";
import { ZohoAdapterService } from "./zoho_adapter.service.js";

@Module({
  imports: [AuthModule],
  controllers: [ZohoAdapterController],
  providers: [ZohoAdapterService],
  exports: [ZohoAdapterService],
})
export class ZohoAdapterModule {}

