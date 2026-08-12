// @ts-nocheck
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { MiscController } from "./controller/misc.controller.js";
import { MiscService } from "./service/misc.service.js";

@Module({
  imports: [AuthModule],
  controllers: [MiscController],
  providers: [MiscService],
  exports: [MiscService],
})
export class MiscModule {}
