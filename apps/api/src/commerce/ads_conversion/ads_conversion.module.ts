import { Module } from "@nestjs/common";
import { AdsConversionController } from "./ads_conversion.controller.js";
import { AdsConversionService } from "./ads_conversion.service.js";

@Module({
  controllers: [AdsConversionController],
  providers: [AdsConversionService],
  exports: [AdsConversionService],
})
export class AdsConversionModule {}
