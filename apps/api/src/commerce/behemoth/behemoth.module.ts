import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { BehemothController } from "./behemoth.controller.js";
import { BehemothService } from "./behemoth.service.js";

@Module({
  imports: [AuthModule],
  controllers: [BehemothController],
  providers: [BehemothService],
  exports: [BehemothService],
})
export class BehemothModule {}
