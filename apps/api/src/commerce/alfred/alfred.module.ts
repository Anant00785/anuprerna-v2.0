import { Module } from "@nestjs/common";
import { AlfredController } from "./alfred.controller.js";
import { AlfredService } from "./alfred.service.js";

@Module({
  controllers: [AlfredController],
  providers: [AlfredService],
  exports: [AlfredService],
})
export class AlfredModule {}
