'use client';

import React, { useState } from 'react';
import {
  AggregatedCronJob,
  CronJobLog,
  formatDuration,
  getDuration,
  getStatusBadgeClass,
} from '@/services/cron-job-service';
import { ChevronRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';

interface CronJobAggregatedRowProps {
  aggregatedJob: AggregatedCronJob;
}

export const CronJobAggregatedRow: React.FC<CronJobAggregatedRowProps> = ({ aggregatedJob }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const pageSize = 5;

  const toggle = () => {
    setIsExpanded((prev) => !prev);
    setCurrentPage(0);
  };

  const totalPages = Math.ceil(aggregatedJob.logs.length / pageSize);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;

  const paginatedLogs: CronJobLog[] = aggregatedJob.logs.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  return (
    <div className="bg-white rounded-xl shadow-2xs border border-slate-200 mb-3 overflow-hidden transition-all">
      {/* Accordion Header */}
      <div
        onClick={toggle}
        className="flex flex-col md:flex-row md:items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50/80 transition-colors gap-4"
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <ChevronRight
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
              isExpanded ? 'rotate-90 text-slate-700' : ''
            }`}
          />
          <span className="font-bold text-slate-800 text-base truncate">
            {aggregatedJob.jobName}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${getStatusBadgeClass(
              aggregatedJob.latestStatus
            )}`}
          >
            {aggregatedJob.latestStatus}
          </span>
        </div>

        <div className="flex flex-wrap items-center space-x-6 text-sm">
          {/* Counts */}
          <div className="flex items-center space-x-3 text-slate-600">
            <span className="font-semibold text-slate-800">
              {aggregatedJob.totalRuns}{' '}
              <span className="font-normal text-slate-500">runs</span>
            </span>

            {aggregatedJob.successCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {aggregatedJob.successCount}
              </span>
            )}

            {aggregatedJob.failureCount > 0 && (
              <span className="flex items-center gap-1 text-red-600 font-semibold">
                <AlertCircle className="w-4 h-4 text-red-500" />
                {aggregatedJob.failureCount}
              </span>
            )}

            {aggregatedJob.runningCount > 0 && (
              <span className="flex items-center gap-1 text-blue-600 font-semibold">
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                {aggregatedJob.runningCount}
              </span>
            )}
          </div>

          {/* Average duration */}
          <div className="text-slate-500 min-w-[80px] text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">AVG</span>
            <span className="ml-1.5 font-bold text-slate-700">
              {formatDuration(aggregatedJob.averageDuration)}
            </span>
          </div>

          {/* Last run time */}
          <div className="text-slate-500 min-w-[150px] text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">LAST</span>
            <span className="ml-1.5 font-semibold text-slate-700">
              {dayjs(aggregatedJob.lastRunTime).format('M/D/YY, h:mm A')}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded History */}
      {isExpanded && (
        <div className="border-t border-slate-200 bg-slate-50/50 p-5 space-y-4 animate-in fade-in duration-150">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Execution History
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Start Time</th>
                  <th className="px-4 py-3">End Time</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-700">#{log.id}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {log.startTime ? dayjs(log.startTime).format('MMM D, YYYY h:mm:ss A') : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {log.endTime !== null ? (
                        dayjs(log.endTime).format('MMM D, YYYY h:mm:ss A')
                      ) : (
                        <span className="text-blue-600 font-medium italic">Running...</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-semibold">
                      {getDuration(log.startTime, log.endTime)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(
                          log.status
                        )}`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-md whitespace-normal break-words">
                      {log.message || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-medium">
                Page {currentPage + 1} of {totalPages} ({aggregatedJob.logs.length} total)
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={!hasPrevPage}
                  className="px-3 py-1 text-xs font-semibold rounded border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={!hasNextPage}
                  className="px-3 py-1 text-xs font-semibold rounded border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {aggregatedJob.logs.length === 0 && (
            <div className="text-center py-4 text-xs text-slate-400">
              No execution history found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
