import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { MiscController } from "./misc.controller.js";
import { MiscService } from "./misc.service.js";

@Module({
  imports: [AuthModule],
  controllers: [MiscController],
  providers: [MiscService],
  exports: [MiscService],
})
export class MiscModule {}
