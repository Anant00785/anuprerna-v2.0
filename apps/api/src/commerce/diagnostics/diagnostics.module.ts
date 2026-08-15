import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { DiagnosticsController } from "./diagnostics.controller.js";
import { DiagnosticsService } from "./diagnostics.service.js";

@Module({
  imports: [AuthModule],
  controllers: [DiagnosticsController],
  providers: [DiagnosticsService],
  exports: [DiagnosticsService],
})
export class DiagnosticsModule {}
