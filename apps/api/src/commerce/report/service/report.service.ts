// @ts-nocheck
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ReportRepository } from '../repository/report.repository.js';
import { ReportType, ReportConfig } from '../types/report.types.js';
import { Response } from 'express';

// For runtime, ensure pdfkit is installed: npm install pdfkit
// import * as PDFDocument from 'pdfkit';

@Injectable()
export class ReportService {
  constructor(private readonly reportRepository: ReportRepository) {}

  async generateReport(type: ReportType, config: ReportConfig, res: Response) {
    let data: any[] = [];
    let title = 'Report';

    if (type === ReportType.FABRIC_STOCK) {
      data = await this.reportRepository.getFabricStock(config);
      title = 'Fabric Stock Report';
    } else if (type === ReportType.FINISHED_STOCK) {
      data = await this.reportRepository.getFinishedStock(config);
      title = 'Finished Stock Report';
    } else {
      throw new HttpException('Invalid Report Type', HttpStatus.BAD_REQUEST);
    }

    try {
      // Dynamic import to avoid compilation error if not installed
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument();
      
      doc.pipe(res);

      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`);
      doc.moveDown();

      // Simple Table layout
      for (const record of data) {
        doc.text(JSON.stringify(record));
        doc.moveDown(0.5);
      }

      doc.end();
    } catch (e) {
      // Fallback if pdfkit is not installed
      res.setHeader('Content-Type', 'text/plain');
      res.send(`Could not generate PDF. Please install pdfkit: npm install pdfkit. \nData: ${JSON.stringify(data)}`);
    }
  }
}
// @ts-nocheck
