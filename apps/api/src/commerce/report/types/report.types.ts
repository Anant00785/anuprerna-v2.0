// @ts-nocheck
export enum ReportType {
  FABRIC_STOCK = 'FABRIC_STOCK',
  FINISHED_STOCK = 'FINISHED_STOCK',
}

export interface FabricStockRecord {
  id: number;
  productName: string;
  quantity: number;
  location: string;
}

export interface FinishedStockRecord {
  id: number;
  productName: string;
  quantity: number;
  quality: string;
}

export interface ReportConfig {
  startDate?: string;
  endDate?: string;
  filters?: Record<string, any>;
}
// @ts-nocheck
// @ts-nocheck
