// @ts-nocheck
import { Module } from "@nestjs/common";
import { ZohoController } from "./zoho.controller.js";
import { ZohoService } from "./zoho.service.js";

@Module({
  controllers: [ZohoController],
  providers: [ZohoService],
  exports: [ZohoService],
})
export class ZohoModule {}
