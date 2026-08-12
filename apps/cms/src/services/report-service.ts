import { apiClient } from '@/lib/api';

export type ReportType = 'FABRIC_STOCK' | 'FINISHED_STOCK';

export interface IReportOption {
  id: ReportType;
  title: string;
  description: string;
  reportName: string;
}

export interface IReportConfig {
  includeDisabled: boolean;
}

export const REPORT_OPTIONS: IReportOption[] = [
  {
    id: 'FABRIC_STOCK',
    title: 'Fabric product inventory report',
    description: 'Stock levels for all fabric products',
    reportName: 'fabric_inventory_report',
  },
  {
    id: 'FINISHED_STOCK',
    title: 'Finished product inventory report',
    description: 'Stock levels for all finished products',
    reportName: 'finished_inventory_report',
  },
];

export class ReportService {
  private static getReportTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
      now.getFullYear().toString() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      '_' +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds())
    );
  }

  public static async downloadReport(
    type: ReportType,
    config: IReportConfig,
    reportName: string
  ): Promise<void> {
    const response = await apiClient.post(`/download/report/${type}`, config, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv' });
    const contentDisposition = response.headers['content-disposition'];
    let filename = `${reportName}_${this.getReportTimestamp()}.csv`;

    if (contentDisposition) {
      const match = /filename="?([^"]+)"?/.exec(contentDisposition);
      if (match?.[1]) {
        filename = match[1];
      }
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
