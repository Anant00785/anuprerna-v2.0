// @ts-nocheck
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { ZohoController } from "./controller/zoho.controller.js";
import { ZohoAuthTokenService } from "./service/zoho-auth.service.js";
import { ZohoService } from "./service/zoho.service.js";

@Module({
  imports: [AuthModule],
  controllers: [ZohoController],
  providers: [ZohoAuthTokenService, ZohoService],
  exports: [ZohoAuthTokenService, ZohoService],
})
export class ZohoModule {}
