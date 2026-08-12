import { Module } from "@nestjs/common";
import { ArtisanpaymentController } from "./artisanpayment.controller.js";
import { ArtisanpaymentService } from "./artisanpayment.service.js";

@Module({
  controllers: [ArtisanpaymentController],
  providers: [ArtisanpaymentService],
  exports: [ArtisanpaymentService],
})
export class ArtisanpaymentModule {}
