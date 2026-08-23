import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { AdsConversionController } from "./ads_conversion.controller.js";
import { AdsConversionService } from "./ads_conversion.service.js";

@Module({
  imports: [AuthModule],
  controllers: [AdsConversionController],
  providers: [AdsConversionService],
  exports: [AdsConversionService],
})
export class AdsConversionModule {}
