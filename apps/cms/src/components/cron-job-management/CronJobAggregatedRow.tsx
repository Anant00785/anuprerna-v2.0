'use client';

import React, { useState } from 'react';
import {
  AggregatedCronJob,
  CronJobLog,
  formatDuration,
  getDuration,
  getStatusBadgeClass,
} from '@/services/cron-job-service';
import { ChevronRight, ChevronDown, Check } from 'lucide-react';
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

  const totalPages = Math.max(1, Math.ceil(aggregatedJob.logs.length / pageSize));
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;

  const paginatedLogs: CronJobLog[] = aggregatedJob.logs.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  return (
    <div className="bg-white rounded-lg shadow-2xs border border-slate-200 mb-2.5 overflow-hidden transition-all">
      {/* Accordion Header */}
      <div
        onClick={toggle}
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50/60 transition-colors gap-3 select-none"
      >
        {/* Left: Chevron + Job Name + Status Badge */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <span className="font-semibold text-slate-800 text-xs truncate">
            {aggregatedJob.jobName}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
              aggregatedJob.latestStatus === 'SUCCESS'
                ? 'bg-[#dcfce7] text-[#166534]'
                : aggregatedJob.latestStatus === 'FAILURE'
                ? 'bg-[#fee2e2] text-[#991b1b]'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {aggregatedJob.latestStatus}
          </span>
        </div>

        {/* Right: Stats */}
        <div className="flex items-center gap-5 text-xs shrink-0">
          {/* Total Runs */}
          <span className="text-slate-500 font-medium whitespace-nowrap">
            {aggregatedJob.totalRuns} runs
          </span>

          {/* Success Count */}
          {aggregatedJob.successCount > 0 && (
            <span className="flex items-center gap-1 text-emerald-600 font-semibold whitespace-nowrap">
              <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600" />
              {aggregatedJob.successCount}
            </span>
          )}

          {/* Failure Count */}
          {aggregatedJob.failureCount > 0 && (
            <span className="flex items-center gap-1 text-rose-600 font-semibold whitespace-nowrap">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold">
                !
              </span>
              {aggregatedJob.failureCount}
            </span>
          )}

          {/* Average Duration */}
          <div className="text-slate-500 whitespace-nowrap">
            <span className="text-[10px] uppercase font-semibold text-slate-400 mr-1">AVG</span>
            <span className="font-bold text-slate-700">
              {formatDuration(aggregatedJob.averageDuration)}
            </span>
          </div>

          {/* Last Run Time */}
          <div className="text-slate-500 whitespace-nowrap">
            <span className="text-[10px] uppercase font-semibold text-slate-400 mr-1">LAST</span>
            <span className="font-normal text-slate-700">
              {dayjs(aggregatedJob.lastRunTime).format('M/D/YY, h:mm A')}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded History */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-white px-5 py-4 space-y-3">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            EXECUTION HISTORY
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-semibold text-slate-400 uppercase border-b border-slate-100 pb-2">
                  <th className="py-2.5 pr-4 font-semibold">ID</th>
                  <th className="py-2.5 px-4 font-semibold">START TIME</th>
                  <th className="py-2.5 px-4 font-semibold">END TIME</th>
                  <th className="py-2.5 px-4 font-semibold">DURATION</th>
                  <th className="py-2.5 px-4 font-semibold">STATUS</th>
                  <th className="py-2.5 pl-4 font-semibold">MESSAGE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 pr-4 font-normal text-slate-700 whitespace-nowrap">
                      {log.id}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {log.startTime ? dayjs(log.startTime).format('MMM D, YYYY, h:mm:ss A') : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {log.endTime !== null ? (
                        dayjs(log.endTime).format('MMM D, YYYY, h:mm:ss A')
                      ) : (
                        <span className="text-blue-600 font-medium italic">Running...</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-normal whitespace-nowrap">
                      {getDuration(log.startTime, log.endTime)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          log.status === 'SUCCESS'
                            ? 'bg-[#dcfce7] text-[#166534]'
                            : log.status === 'FAILURE'
                            ? 'bg-[#fee2e2] text-[#991b1b]'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-slate-600 truncate max-w-xs">
                      {log.message || 'Job completed successfully'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 text-[11px]">
              Page {currentPage + 1} of {totalPages} ({aggregatedJob.logs.length} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={!hasPrevPage}
                className="px-3 py-1 text-xs border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={!hasNextPage}
                className="px-3 py-1 text-xs border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
