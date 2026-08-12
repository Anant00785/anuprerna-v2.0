// @ts-nocheck
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { LoyaltyprogramController } from "./controller/loyaltyprogram.controller.js";
import { LoyaltyprogramService } from "./service/loyaltyprogram.service.js";
import { LoyaltyprogramRepository } from "./repository/loyaltyprogram.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [LoyaltyprogramController],
  providers: [LoyaltyprogramService, LoyaltyprogramRepository],
  exports: [LoyaltyprogramService, LoyaltyprogramRepository],
})
export class LoyaltyprogramModule {}
