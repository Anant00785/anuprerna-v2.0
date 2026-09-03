import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Controller, Post, Param, Body, Res, UseGuards } from '@nestjs/common';
import { ReportService } from '../service/report.service.js';
import { ReportType, parseReportConfig } from '../types/report.types.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import { Response } from 'express';

/** Ports com.bloomscorp.loom.report.controller.ReportController. */
@ApiBearerAuth()
@ApiTags("Reports")
@Controller('download/report')
@UseGuards(RolesGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post(':type')
  @RequireGate(GateCode.CODE_SU)
  async downloadReport(
    @Param('type') type: string,
    @Body() body: unknown,
    @Res() res: Response,
  ) {
    // Java: DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss").
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp =
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const csv = await this.reportService.renderReport(
      type.toUpperCase() as ReportType,
      parseReportConfig(body),
    );

    res.setHeader('Content-Disposition', `attachment; filename=${type}_report_${timestamp}.csv`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  }
}
