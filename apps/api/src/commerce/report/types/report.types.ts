/**
 * Ports com.bloomscorp.loom.report.
 *
 * Loom's /download/report/{type} streams **CSV** (ReportController sets
 * `text/csv` and a `.csv` filename); the two generators are FabricStockReport
 * and FinishedStockReport, both writing rows through a PrintWriter.
 */
export enum ReportType {
  FABRIC_STOCK = 'FABRIC_STOCK',
  FINISHED_STOCK = 'FINISHED_STOCK',
}

/** Ports com.bloomscorp.loom.report.pojo.ReportConfig — one field, `includeDisabled`. */
export interface ReportConfig {
  includeDisabled: boolean;
}

export function parseReportConfig(raw: unknown): ReportConfig {
  const body = (raw ?? {}) as Record<string, unknown>;
  // Java's builder default for a boolean field is false.
  return { includeDisabled: body.includeDisabled === true || body.includeDisabled === 'true' };
}

/** One row of FabricStockReport, straight from the JOIN FETCH in streamAllByFabricProduct. */
export interface FabricStockRecord {
  productId: number;
  productName: string;
  productSku: string;
  zohoItemId: string;
  quantity: number;
  externalQuantity: number;
  price: number;
  disabled: boolean;
}

/** One row of FinishedStockReport. */
export interface FinishedStockRecord {
  productId: number;
  productName: string;
  sku: string;
  zohoItemId: string;
  zohoQuantity: number;
  disabled: boolean;
}
