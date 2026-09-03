import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { ArtisanPaymentController } from "./controller/artisanpayment.controller.js";
import { ArtisanPaymentService } from "./service/artisanpayment.service.js";
import { ArtisanPaymentRepository } from "./repository/artisanpayment.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [ArtisanPaymentController],
  providers: [ArtisanPaymentService, ArtisanPaymentRepository],
  exports: [ArtisanPaymentService, ArtisanPaymentRepository],
})
export class ArtisanpaymentModule {}
