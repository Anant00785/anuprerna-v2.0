// @ts-nocheck
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { ReportController } from "./controller/report.controller.js";
import { ReportService } from "./service/report.service.js";
import { ReportRepository } from "./repository/report.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [ReportController],
  providers: [ReportService, ReportRepository],
  exports: [ReportService, ReportRepository],
})
export class ReportModule {}
