'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeading } from '@/components/ui/PageHeading';
import {
  AggregatedCronJob,
  CronJobLog,
  CronJobLogStatus,
  CronJobService,
  aggregateCronLogs,
} from '@/services/cron-job-service';
import { CronJobAggregatedRow } from '@/components/cron-job-management/CronJobAggregatedRow';
import { RefreshCw, Inbox, AlertCircle } from 'lucide-react';

type StatusFilter = 'ALL' | CronJobLogStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'SUCCESS', label: 'Success' },
  { value: 'FAILURE', label: 'Failure' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'SKIPPED', label: 'Skipped' },
];

export default function CronJobManagementPage() {
  const [aggregatedJobs, setAggregatedJobs] = useState<AggregatedCronJob[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchCronLogs = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const logs: CronJobLog[] = await CronJobService.getCronJobLogs();
      const aggregated = aggregateCronLogs(logs || []);
      setAggregatedJobs(aggregated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load cron job logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCronLogs();
  }, [fetchCronLogs]);

  const filteredJobs = useMemo(() => {
    if (statusFilter === 'ALL') {
      return aggregatedJobs;
    }
    return aggregatedJobs.filter((job) => job.latestStatus === statusFilter);
  }, [aggregatedJobs, statusFilter]);

  return (
    <div className="space-y-4 pt-1 pb-16 max-w-7xl mx-auto">
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Top Banner Card */}
      <div className="w-full bg-[#585c82] text-white px-4 py-2.5 rounded text-xs font-bold tracking-wider uppercase flex items-center justify-between">
        <span>TOTAL COUNT ({filteredJobs.length})</span>
      </div>

      {/* Filter and Refresh Controls */}
      <div className="flex items-center justify-between gap-4 py-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Filter by status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded text-slate-800 font-medium focus:outline-none shadow-2xs"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={fetchCronLogs}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1d4ed8] hover:bg-blue-700 rounded shadow-xs transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Job List or Loading / Empty */}
      {loading && aggregatedJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-slate-200 space-y-3">
          <RefreshCw className="w-6 h-6 text-[#585c82] animate-spin" />
          <p className="text-slate-500 text-xs font-medium">Loading cron job logs...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredJobs.map((job) => (
            <CronJobAggregatedRow key={job.jobName} aggregatedJob={job} />
          ))}

          {filteredJobs.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200 space-y-2">
              <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-slate-500 text-xs font-medium">
                {statusFilter === 'ALL'
                  ? 'No cron job logs available'
                  : `No jobs with status: ${statusFilter}`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
