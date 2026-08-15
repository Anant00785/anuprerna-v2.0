// @ts-nocheck
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { ForexController } from "./controller/forex.controller.js";
import { ForexService } from "./service/forex.service.js";
import { ForexRepository } from "./repository/forex.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [ForexController],
  providers: [ForexService, ForexRepository],
  exports: [ForexService, ForexRepository],
})
export class ForexModule {}
