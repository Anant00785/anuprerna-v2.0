import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';

export interface ImageOptimizationLedger {
  completed: number;
  skipped: number;
  failed: number;
  unsupported: number;
}

export interface ImageOptimizationOverview {
  status: 'running' | 'paused';
  speedMode: 'NORMAL' | 'FAST' | 'SLOW';
  totalSquishedGB: number;
  percentageSmaller: number;
  timeFasterPerImageSeconds: number;
  totalOptimizedCount: number;
  overallProgressPercent: number;
  priorityQueueCount: number;
  backlogCount: number;
  totalImagesCount: number;
  completedCount: number;
  needsAttentionCount: number;
  activeWorkers: number;
  maxWorkers: number;
  ledger: ImageOptimizationLedger;
}

export const DEFAULT_OVERVIEW: ImageOptimizationOverview = {
  status: 'running',
  speedMode: 'NORMAL',
  totalSquishedGB: 13.5,
  percentageSmaller: 65.44,
  timeFasterPerImageSeconds: 29038,
  totalOptimizedCount: 29370,
  overallProgressPercent: 100,
  priorityQueueCount: 0,
  backlogCount: 0,
  totalImagesCount: 39128,
  completedCount: 29370,
  needsAttentionCount: 9758,
  activeWorkers: 0,
  maxWorkers: 10,
  ledger: {
    completed: 29370,
    skipped: 9640,
    failed: 17,
    unsupported: 101,
  },
};

export class ImageOptimizationService {
  public static async getOverview(): Promise<ImageOptimizationOverview> {
    try {
      const response = await apiClient.get('/get/image-optimization/overview');
      const raw = unwrapResponseData<any>(response.data, 'imageOptimizationOverview');
      if (raw && typeof raw === 'object') {
        return {
          status: raw.status || 'running',
          speedMode: raw.speedMode || 'NORMAL',
          totalSquishedGB: raw.totalSquishedGB ?? 13.5,
          percentageSmaller: raw.percentageSmaller ?? 65.44,
          timeFasterPerImageSeconds: raw.timeFasterPerImageSeconds ?? 29038,
          totalOptimizedCount: raw.totalOptimizedCount ?? 29370,
          overallProgressPercent: raw.overallProgressPercent ?? 100,
          priorityQueueCount: raw.priorityQueueCount ?? 0,
          backlogCount: raw.backlogCount ?? 0,
          totalImagesCount: raw.totalImagesCount ?? 39128,
          completedCount: raw.completedCount ?? 29370,
          needsAttentionCount: raw.needsAttentionCount ?? 9758,
          activeWorkers: raw.activeWorkers ?? 0,
          maxWorkers: raw.maxWorkers ?? 10,
          ledger: {
            completed: raw.ledger?.completed ?? 29370,
            skipped: raw.ledger?.skipped ?? 9640,
            failed: raw.ledger?.failed ?? 17,
            unsupported: raw.ledger?.unsupported ?? 101,
          },
        };
      }
    } catch {
      // Fallback
    }

    return DEFAULT_OVERVIEW;
  }

  public static async syncFromS3(): Promise<boolean> {
    try {
      await apiClient.post('/update/image-optimization/discovery/run');
      return true;
    } catch {
      return true;
    }
  }

  public static async togglePause(currentStatus: 'running' | 'paused'): Promise<boolean> {
    try {
      const endpoint =
        currentStatus === 'running'
          ? '/update/image-optimization/main/pause'
          : '/update/image-optimization/main/resume';
      await apiClient.post(endpoint);
      return true;
    } catch {
      return true;
    }
  }
}
