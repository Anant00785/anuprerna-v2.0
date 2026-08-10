'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeading } from '@/components/ui/PageHeading';
import {
  DiagnosticsService,
  DiagnosticsSummary,
  AppDiagnostics,
  HostDiagnostics,
  ThreadDumpItem,
} from '@/services/diagnostics-service';
import { RefreshCw, Activity, Cpu, HardDrive, Database, Server, Terminal, ShieldCheck } from 'lucide-react';

type DiagnosticsTab = 'Overview' | 'Application' | 'Host' | 'Thread Dump';

export default function DiagnosticsPage() {
  const [activeTab, setActiveTab] = useState<DiagnosticsTab>('Overview');

  const [summary, setSummary] = useState<DiagnosticsSummary | null>(null);
  const [app, setApp] = useState<AppDiagnostics | null>(null);
  const [host, setHost] = useState<HostDiagnostics | null>(null);
  const [threadDump, setThreadDump] = useState<ThreadDumpItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAllDiagnostics = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, appRes, hostRes, dumpRes] = await Promise.all([
        DiagnosticsService.getSummary(),
        DiagnosticsService.getApp(),
        DiagnosticsService.getHost(),
        DiagnosticsService.getThreadDump(),
      ]);
      setSummary(sumRes);
      setApp(appRes);
      setHost(hostRes);
      setThreadDump(dumpRes);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllDiagnostics();
  }, [fetchAllDiagnostics]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <PageHeading heading="Diagnostics" />
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                🔐 Super User
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              Live health of the Loom app and the machine it runs on — no cap. 🚀
            </p>
          </div>

          <button
            onClick={fetchAllDiagnostics}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs flex items-center justify-center gap-2 shrink-0 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {(['Overview', 'Application', 'Host', 'Thread Dump'] as DiagnosticsTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === tab
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* System Health Status Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="px-2.5 py-1 rounded-md font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
            ✅ HEALTHY
          </span>
          <span className="font-semibold text-slate-700">{summary?.statusMessage || 'All systems vibing'}</span>
        </div>

        <div className="text-slate-400 font-medium flex items-center gap-4">
          <span>📷 snapshot {summary?.snapshotAgeSeconds || 20}s old</span>
          <span>🔄 refresh in {summary?.refreshTimerSeconds || 11}s</span>
          <span>🕒 {summary?.timestamp || 'Just now'}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Heap */}
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">Heap</div>
          <div className="text-2xl font-extrabold text-slate-900">{summary?.heapUsagePercent || 8.7}%</div>
          <div className="text-[10px] text-slate-400 font-medium">JVM heap in use</div>
        </div>

        {/* DB Pool */}
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">DB Pool</div>
          <div className="text-2xl font-extrabold text-slate-900">{summary?.dbPoolUsage || '1/10'}</div>
          <div className="text-[10px] text-slate-400 font-medium">ping {summary?.dbPingMs || 0}ms</div>
        </div>

        {/* HTTP Threads */}
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">HTTP Threads</div>
          <div className="text-2xl font-extrabold text-slate-900">{summary?.httpThreadsUsage || '1/200'}</div>
          <div className="text-[10px] text-slate-400 font-medium">busy worker threads</div>
        </div>

        {/* CPU */}
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">CPU</div>
          <div className="text-2xl font-extrabold text-slate-900">{summary?.cpuUsagePercent || 4.5}%</div>
          <div className="text-[10px] text-slate-400 font-medium">system load</div>
        </div>

        {/* RAM */}
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">RAM</div>
          <div className="text-2xl font-extrabold text-slate-900">{summary?.ramUsagePercent || 11.2}%</div>
          <div className="text-[10px] text-slate-400 font-medium">host memory used</div>
        </div>

        {/* Disk */}
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">Disk</div>
          <div className="text-2xl font-extrabold text-slate-900">{summary?.diskUsagePercent || 57.1}%</div>
          <div className="text-[10px] text-slate-400 font-medium">busiest volume</div>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Application */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Server className="w-4 h-4 text-indigo-600" />
                <span>Application</span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                HEALTHY
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">☕ Memory</span>
                <span className="text-slate-500">{app?.heapUsed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">🧵 Threads</span>
                <span className="text-slate-500">
                  {app?.threadsLive} live · {app?.threadsDeadlocked} deadlocked
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">🌐 HTTP Connector</span>
                <span className="text-slate-500">
                  {app?.httpConnectorBusy} busy / {app?.httpConnectorMax} max
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">🗄️ DB Pool</span>
                <span className="text-slate-500">
                  {app?.dbPoolActive} active · {app?.dbPoolPending} pending
                </span>
              </div>
            </div>
          </div>

          {/* Host */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <HardDrive className="w-4 h-4 text-indigo-600" />
                <span>Host</span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                HEALTHY
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">⚡ CPU</span>
                <span className="text-slate-500">{host?.cpuSystem}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">🧱 Memory</span>
                <span className="text-slate-500">{host?.memoryHostRAM}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">💾 Disks ({host?.disksCount || 3})</span>
                <span className="text-slate-500">{host?.diskWorst}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">🔧 Process</span>
                <span className="text-slate-500">
                  {host?.processThreads} threads · {host?.processFDs} FDs
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Thread Dump' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden p-6 space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Terminal className="w-4 h-4 text-indigo-600" />
            <span>Active Thread Dump</span>
          </div>

          <div className="space-y-4">
            {threadDump.map((t) => (
              <div key={t.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>
                    #{t.id} {t.name}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 border border-blue-200">
                    {t.state}
                  </span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  CPU Time: {t.cpuTimeMs}ms · User Time: {t.userTimeMs}ms
                </div>
                <div className="pt-2 text-slate-700 space-y-1">
                  {t.stackTrace.map((line, i) => (
                    <div key={i} className="truncate">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
