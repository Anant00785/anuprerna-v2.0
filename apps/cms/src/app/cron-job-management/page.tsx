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
    <div className="space-y-6 pb-12">
      <PageHeading heading="CRON JOB LOGS" />

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Top Banner Card */}
      <div className="w-full bg-[#565985] text-white px-6 py-4 rounded-xl shadow-xs font-bold text-sm tracking-wider uppercase flex items-center justify-between">
        <span>TOTAL COUNT ({filteredJobs.length})</span>
      </div>

      {/* Filter and Refresh Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-sm">
          <label className="text-slate-600 font-semibold">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-2xs"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchCronLogs}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Loading...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Job List or Loading / Empty */}
      {loading && aggregatedJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200 space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading cron job logs...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <CronJobAggregatedRow key={job.jobName} aggregatedJob={job} />
          ))}

          {filteredJobs.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-500 text-sm font-medium">
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
