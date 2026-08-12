// @ts-nocheck
import { ApiBearerAuth } from "@nestjs/swagger";
import { Controller, Post, Param, Body, Res, UseGuards } from '@nestjs/common';
import { ReportService } from '../service/report.service.js';
import { ReportType, ReportConfig } from '../types/report.types.js';
import { RolesGuard, RequireGate } from '../../common/auth/roles.guard.js';
import { GateCode } from '../../auth/types/auth.types.js';
import { Response } from 'express';

@ApiBearerAuth()
@Controller('download/report')
@UseGuards(RolesGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post(':type')
  @RequireGate(GateCode.CODE_SU)
  async downloadReport(
    @Param('type') type: string,
    @Body() config: ReportConfig,
    @Res() res: Response
  ) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${type}_report_${timestamp}.pdf`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');

    await this.reportService.generateReport(type as ReportType, config || {}, res);
  }
}
