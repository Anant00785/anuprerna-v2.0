import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';

export type CronJobLogStatus = 'RUNNING' | 'SUCCESS' | 'FAILURE' | 'SKIPPED';

export interface CronJobLog {
  id: number;
  jobName: string;
  startTime: number;
  endTime: number | null;
  status: CronJobLogStatus;
  message: string | null;
  createdAt: number;
}

export interface AggregatedCronJob {
  jobName: string;
  totalRuns: number;
  successCount: number;
  failureCount: number;
  runningCount: number;
  skippedCount: number;
  latestStatus: CronJobLogStatus;
  lastRunTime: number;
  averageDuration: number;
  logs: CronJobLog[];
}

export function formatDuration(durationMs: number): string {
  if (durationMs === 0 || isNaN(durationMs)) {
    return '-';
  }
  const totalSeconds = Math.floor(durationMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

export function getDuration(startTime: number, endTime: number | null): string {
  if (endTime === null) {
    return 'Running...';
  }
  const durationMs = Math.max(0, endTime - startTime);
  return formatDuration(durationMs);
}

export function getStatusBadgeClass(status: CronJobLogStatus): string {
  switch (status) {
    case 'SUCCESS':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    case 'FAILURE':
      return 'bg-red-100 text-red-800 border border-red-200';
    case 'RUNNING':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'SKIPPED':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    default:
      return 'bg-slate-100 text-slate-800 border border-slate-200';
  }
}

export function aggregateCronLogs(logs: CronJobLog[]): AggregatedCronJob[] {
  const jobMap = new Map<
    string,
    {
      logs: CronJobLog[];
      successCount: number;
      failureCount: number;
      runningCount: number;
      skippedCount: number;
      totalDuration: number;
      completedCount: number;
    }
  >();

  for (const log of logs) {
    let job = jobMap.get(log.jobName);
    if (!job) {
      job = {
        logs: [],
        successCount: 0,
        failureCount: 0,
        runningCount: 0,
        skippedCount: 0,
        totalDuration: 0,
        completedCount: 0,
      };
      jobMap.set(log.jobName, job);
    }

    job.logs.push(log);

    switch (log.status) {
      case 'SUCCESS':
        job.successCount++;
        break;
      case 'FAILURE':
        job.failureCount++;
        break;
      case 'RUNNING':
        job.runningCount++;
        break;
      case 'SKIPPED':
        job.skippedCount++;
        break;
    }

    if (log.endTime !== null) {
      job.totalDuration += log.endTime - log.startTime;
      job.completedCount++;
    }
  }

  const aggregated: AggregatedCronJob[] = [];

  jobMap.forEach((stats, jobName) => {
    stats.logs.sort((a, b) => b.startTime - a.startTime);

    const averageDuration =
      stats.completedCount > 0 ? stats.totalDuration / stats.completedCount : 0;

    aggregated.push({
      jobName,
      totalRuns: stats.logs.length,
      successCount: stats.successCount,
      failureCount: stats.failureCount,
      runningCount: stats.runningCount,
      skippedCount: stats.skippedCount,
      latestStatus: stats.logs[0].status,
      lastRunTime: stats.logs[0].startTime,
      averageDuration,
      logs: stats.logs,
    });
  });

  aggregated.sort((a, b) => b.lastRunTime - a.lastRunTime);

  return aggregated;
}

export class CronJobService {
  public static async getCronJobLogs(): Promise<CronJobLog[]> {
    const response = await apiClient.get('/get/cron-logs');
    return unwrapResponseData<CronJobLog[]>(response.data, 'cronJobLogList');
  }
}
