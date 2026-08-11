import { Module } from "@nestjs/common";
import { BehemothController } from "./behemoth.controller.js";
import { BehemothService } from "./behemoth.service.js";

@Module({
  controllers: [BehemothController],
  providers: [BehemothService],
  exports: [BehemothService],
})
export class BehemothModule {}
