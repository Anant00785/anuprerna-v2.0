import { Module } from "@nestjs/common";
import { DiagnosticsController } from "./diagnostics.controller.js";
import { DiagnosticsService } from "./diagnostics.service.js";

@Module({
  controllers: [DiagnosticsController],
  providers: [DiagnosticsService],
  exports: [DiagnosticsService],
})
export class DiagnosticsModule {}
