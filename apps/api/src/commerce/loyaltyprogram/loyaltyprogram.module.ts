import { Module } from "@nestjs/common";
import { LoyaltyprogramController } from "./loyaltyprogram.controller.js";
import { LoyaltyprogramService } from "./loyaltyprogram.service.js";

@Module({
  controllers: [LoyaltyprogramController],
  providers: [LoyaltyprogramService],
  exports: [LoyaltyprogramService],
})
export class LoyaltyprogramModule {}

