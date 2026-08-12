import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { AlfredController } from "./alfred.controller.js";
import { AlfredService } from "./alfred.service.js";

@Module({
  imports: [AuthModule],
  controllers: [AlfredController],
  providers: [AlfredService],
  exports: [AlfredService],
})
export class AlfredModule {}
