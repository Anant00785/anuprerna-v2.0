import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { FaqController } from "./controller/faq.controller.js";
import { FaqService } from "./service/faq.service.js";
import { FaqRepository } from "./repository/faq.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [FaqController],
  providers: [FaqService, FaqRepository],
  exports: [FaqService, FaqRepository],
})
export class FaqModule {}
