import { Module } from "@nestjs/common";
import { ZohoAdapterController } from "./zoho_adapter.controller.js";
import { ZohoAdapterService } from "./zoho_adapter.service.js";

@Module({
  controllers: [ZohoAdapterController],
  providers: [ZohoAdapterService],
  exports: [ZohoAdapterService],
})
export class ZohoAdapterModule {}

