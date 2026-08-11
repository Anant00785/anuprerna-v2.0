import { Module } from "@nestjs/common";
import { MiscController } from "./misc.controller.js";
import { MiscService } from "./misc.service.js";

@Module({
  controllers: [MiscController],
  providers: [MiscService],
  exports: [MiscService],
})
export class MiscModule {}

