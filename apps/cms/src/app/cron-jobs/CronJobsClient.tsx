"use client";

import React, { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { Badge } from "@/components/ui";
import { formatEpoch, formatCount } from "@/lib/utils";
import type { CronJobLog, CronJobStatus } from "@/lib/admin-api";

function formatDuration(startTime: number, endTime: number | null): string {
  if (endTime == null) return "—";
  const ms = endTime - startTime;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

function avgDuration(logs: CronJobLog[]): string {
  const completed = logs.filter((l) => l.endTime != null);
  if (!completed.length) return "—";
  const avg = completed.reduce((sum, l) => sum + (l.endTime! - l.startTime), 0) / completed.length;
  return formatDuration(0, avg);
}

function statusBadge(s: CronJobStatus) {
  if (s === "SUCCESS") return <Badge variant="green">Success</Badge>;
  if (s === "FAILURE") return <Badge variant="red">Failure</Badge>;
  if (s === "RUNNING") return <Badge variant="blue">Running</Badge>;
  return <Badge variant="stone">Skipped</Badge>;
}

interface JobSummary {
  jobName: string;
  total: number;
  success: number;
  failure: number;
  running: number;
  skipped: number;
  latestStatus: CronJobStatus;
  lastRunTime: number;
  avgDurationStr: string;
  /** FULL run history for this job, newest first — NOT pre-sliced (fixed
   * 2026-07-06: the old code hard-capped this at 10 with no way to see more;
   * some jobs have up to 198 runs). Slicing for display happens at render
   * time via the per-job "visible count" below. */
  sortedLogs: CronJobLog[];
}

type FilterTab = "ALL" | CronJobStatus;

interface CronJobsClientProps {
  logs: CronJobLog[];
}

const PAGE_STEP = 10;

export function CronJobsClient({ logs }: CronJobsClientProps) {
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();

  const jobSummaries = useMemo<JobSummary[]>(() => {
    const map = new Map<string, CronJobLog[]>();
    for (const log of logs) {
      const arr = map.get(log.jobName) ?? [];
      arr.push(log);
      map.set(log.jobName, arr);
    }
    return Array.from(map.entries())
      .map(([jobName, jobLogs]) => {
        const sorted = [...jobLogs].sort((a, b) => b.startTime - a.startTime);
        return {
          jobName,
          total: jobLogs.length,
          success: jobLogs.filter((l) => l.status === "SUCCESS").length,
          failure: jobLogs.filter((l) => l.status === "FAILURE").length,
          running: jobLogs.filter((l) => l.status === "RUNNING").length,
          skipped: jobLogs.filter((l) => l.status === "SKIPPED").length,
          latestStatus: sorted[0]?.status ?? ("SKIPPED" as CronJobStatus),
          lastRunTime: sorted[0]?.startTime ?? 0,
          avgDurationStr: avgDuration(jobLogs),
          sortedLogs: sorted,
        };
      })
      .sort((a, b) => b.lastRunTime - a.lastRunTime);
  }, [logs]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return jobSummaries;
    return jobSummaries.filter((j) => j.latestStatus === filter);
  }, [jobSummaries, filter]);

  const toggleExpand = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setVisibleCounts((prev) => (prev[name] ? prev : { ...prev, [name]: PAGE_STEP }));
  };

  const showMore = (name: string, total: number) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [name]: Math.min((prev[name] ?? PAGE_STEP) + PAGE_STEP, total),
    }));
  };

  const filterTabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "ALL", label: "All", count: jobSummaries.length },
    { id: "SUCCESS", label: "Success", count: jobSummaries.filter((j) => j.latestStatus === "SUCCESS").length },
    { id: "FAILURE", label: "Failure", count: jobSummaries.filter((j) => j.latestStatus === "FAILURE").length },
    { id: "RUNNING", label: "Running", count: jobSummaries.filter((j) => j.latestStatus === "RUNNING").length },
    { id: "SKIPPED", label: "Skipped", count: jobSummaries.filter((j) => j.latestStatus === "SKIPPED").length },
  ];

  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
      <span>Operations</span><span>/</span>
      <span className="font-medium" style={{ color: "#1A1714" }}>Cron Jobs</span>
    </div>
  );

  return (
    <WeaveShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Cron Jobs</h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              {formatCount(logs.length)} log entries · {formatCount(jobSummaries.length)} jobs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={refreshing}
              onClick={() => startRefresh(() => router.refresh())}
              data-testid="cronjobs-flow-refresh"
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-stone-50 disabled:opacity-50"
              style={{ borderColor: "#E8E4DE", color: "#A86120" }}
            >
              <RefreshCw className={`h-3.5 w-3.5${refreshing ? " animate-spin" : ""}`} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <Clock className="h-6 w-6" style={{ color: "#A86120" }} />
          </div>
        </div>

        <div className="flex flex-wrap gap-1 border-b" style={{ borderColor: "#E8E4DE" }}>
          {filterTabs.map((t) => {
            const isActive = filter === t.id;
            return (
              <button key={t.id} type="button" onClick={() => setFilter(t.id)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2"
                style={{ color: isActive ? "#A86120" : "#847D77", borderColor: isActive ? "#A86120" : "transparent" }}
              >
                {t.label}
                <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: isActive ? "#FEF3E2" : "#F3F1ED", color: isActive ? "#A86120" : "#847D77" }}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          {filtered.map((job) => {
            const isOpen = expanded.has(job.jobName);
            const visibleCount = visibleCounts[job.jobName] ?? PAGE_STEP;
            const visibleLogs = job.sortedLogs.slice(0, visibleCount);
            const hasMore = visibleCount < job.sortedLogs.length;
            return (
              <div key={job.jobName} className="rounded-lg border overflow-hidden" style={{ borderColor: "#E8E4DE" }}>
                <button type="button"
                  className="w-full flex items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-stone-50"
                  onClick={() => toggleExpand(job.jobName)}
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm" style={{ color: "#1A1714" }}>{job.jobName}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                    <span className="text-xs" style={{ color: "#847D77" }}>{formatCount(job.total)} runs</span>
                    <div className="flex gap-1.5">
                      {job.success > 0 && <Badge variant="green">{job.success} ok</Badge>}
                      {job.failure > 0 && <Badge variant="red">{job.failure} fail</Badge>}
                      {job.running > 0 && <Badge variant="blue">{job.running} run</Badge>}
                      {job.skipped > 0 && <Badge variant="stone">{job.skipped} skip</Badge>}
                    </div>
                    <span className="text-xs" style={{ color: "#847D77" }}>Last: {formatEpoch(job.lastRunTime)}</span>
                    <span className="text-xs" style={{ color: "#847D77" }}>Avg: {job.avgDurationStr}</span>
                    {statusBadge(job.latestStatus)}
                    {isOpen
                      ? <ChevronUp className="h-4 w-4" style={{ color: "#847D77" }} />
                      : <ChevronDown className="h-4 w-4" style={{ color: "#847D77" }} />
                    }
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t" style={{ borderColor: "#E8E4DE" }}>
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: "#FAF9F7" }}>
                          {["Start", "End", "Duration", "Status", "Message"].map((h) => (
                            <th key={h} className="px-4 py-2 text-left font-medium" style={{ color: "#847D77" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {visibleLogs.map((log, i) => (
                          <tr key={log.id} style={{ background: i % 2 === 0 ? "#FFFFFF" : "#FAF9F7" }}>
                            <td className="px-4 py-2" style={{ color: "#635D58" }}>{formatEpoch(log.startTime)}</td>
                            <td className="px-4 py-2" style={{ color: "#635D58" }}>{log.endTime ? formatEpoch(log.endTime) : "—"}</td>
                            <td className="px-4 py-2" style={{ color: "#635D58" }}>{formatDuration(log.startTime, log.endTime)}</td>
                            <td className="px-4 py-2">{statusBadge(log.status)}</td>
                            <td className="px-4 py-2 max-w-xs truncate" style={{ color: "#635D58" }} title={log.message ?? ""}>{log.message ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex items-center justify-between px-4 py-2 border-t" style={{ borderColor: "#E8E4DE", background: "#FAF9F7" }}>
                      <span className="text-[11px]" style={{ color: "#AAA39E" }}>
                        Showing {visibleLogs.length} of {job.sortedLogs.length} runs
                      </span>
                      {hasMore && (
                        <button
                          type="button"
                          onClick={() => showMore(job.jobName, job.sortedLogs.length)}
                          className="text-xs font-medium hover:underline"
                          style={{ color: "#A86120" }}
                        >
                          Show {Math.min(PAGE_STEP, job.sortedLogs.length - visibleCount)} more
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm" style={{ color: "#847D77" }}>
              No jobs with that status.
            </div>
          )}
        </div>
      </div>
    </WeaveShell>
  );
}
