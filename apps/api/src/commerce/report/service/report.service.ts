import { Injectable, BadRequestException } from '@nestjs/common';
import { ReportRepository } from '../repository/report.repository.js';
import { ReportType, ReportConfig } from '../types/report.types.js';

/**
 * Ports ReportFactoryService + FabricStockReport + FinishedStockReport.
 *
 * The Java generators write CSV through a PrintWriter, one `printf` per row,
 * flushing as they go; the controller streams that body as `text/csv`. The
 * column headers and the `%.2f` numeric formatting below are byte-for-byte the
 * Java format strings so existing consumers keep parsing.
 */
@Injectable()
export class ReportService {
  constructor(private readonly reportRepository: ReportRepository) {}

  /** Java's `%.2f`. */
  private static num(value: number): string {
    return value.toFixed(2);
  }

  private static line(fields: (string | number | boolean)[]): string {
    return `${fields.join(',')}\n`;
  }

  /**
   * Renders the report as CSV text.
   *
   * ponytail: fields are written unquoted, exactly as Java's `printf` does, so
   * a product name containing a comma splits the row in both implementations.
   * Fixing it here would silently change the wire format; quote on both sides
   * together if that matters.
   */
  async renderReport(type: ReportType, config: ReportConfig): Promise<string> {
    if (type === ReportType.FABRIC_STOCK) {
      const rows = await this.reportRepository.getFabricStock(config);
      let csv = 'ID, Name, SKU, Zoho Item ID, Zoho Quantity, External Quantity, Total Quantity, Price, Disabled\n';
      for (const r of rows) {
        csv += ReportService.line([
          r.productId,
          r.productName,
          r.productSku,
          r.zohoItemId,
          ReportService.num(r.quantity),
          ReportService.num(r.externalQuantity),
          ReportService.num(r.quantity + r.externalQuantity),
          ReportService.num(r.price),
          r.disabled,
        ]);
      }
      return csv;
    }

    if (type === ReportType.FINISHED_STOCK) {
      const rows = await this.reportRepository.getFinishedStock(config);
      let csv = 'ID, Name, SKU, Zoho Item ID, Zoho Quantity, Total Quantity, Disabled\n';
      for (const r of rows) {
        csv += ReportService.line([
          r.productId,
          r.productName,
          r.sku,
          r.zohoItemId,
          ReportService.num(r.zohoQuantity),
          ReportService.num(r.zohoQuantity),
          r.disabled,
        ]);
      }
      return csv;
    }

    // ReportFactoryService.exportReport throws IllegalArgumentException here.
    throw new BadRequestException(`Unsupported report type: ${String(type)}`);
  }
}
