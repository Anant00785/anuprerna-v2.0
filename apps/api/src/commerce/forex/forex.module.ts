import { Module } from "@nestjs/common";
import { ForexController } from "./forex.controller.js";
import { ForexService } from "./forex.service.js";

@Module({
  controllers: [ForexController],
  providers: [ForexService],
  exports: [ForexService],
})
export class ForexModule {}
