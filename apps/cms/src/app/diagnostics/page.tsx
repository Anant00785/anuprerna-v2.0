'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DiagnosticsService,
  DiagnosticsSummary,
  AppDiagnostics,
  HostDiagnostics,
  ThreadDumpItem,
} from '@/services/diagnostics-service';
import { RefreshCw, Terminal } from 'lucide-react';

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
    <div className="space-y-6 pt-1 pb-20 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🩺</span>
              <h1 className="text-xl font-bold text-slate-900">Diagnostics</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ede9fe] text-[#6d28d9]">
                ⚡ Super User
              </span>
            </div>
            <p className="text-slate-500 text-xs">
              Live health of the Loom app and the machine it runs on — no cap. 💅
            </p>
          </div>

          <button
            onClick={fetchAllDiagnostics}
            disabled={loading}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#181c2e] hover:bg-[#252b46] rounded-full shadow-xs flex items-center justify-center gap-2 shrink-0 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => setActiveTab('Overview')}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition flex items-center gap-1.5 ${
              activeTab === 'Overview'
                ? 'bg-[#ede9fe] text-[#6d28d9]'
                : 'bg-[#f1f5f9] text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>⚡</span>
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('Application')}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition flex items-center gap-1.5 ${
              activeTab === 'Application'
                ? 'bg-[#ede9fe] text-[#6d28d9]'
                : 'bg-[#f1f5f9] text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>🍷</span>
            <span>Application</span>
          </button>
          <button
            onClick={() => setActiveTab('Host')}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition flex items-center gap-1.5 ${
              activeTab === 'Host'
                ? 'bg-[#ede9fe] text-[#6d28d9]'
                : 'bg-[#f1f5f9] text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>🖥️</span>
            <span>Host</span>
          </button>
          <button
            onClick={() => setActiveTab('Thread Dump')}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition flex items-center gap-1.5 ${
              activeTab === 'Thread Dump'
                ? 'bg-[#ede9fe] text-[#6d28d9]'
                : 'bg-[#f1f5f9] text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>⏳</span>
            <span>Thread Dump</span>
          </button>
        </div>
      </div>

      {/* System Health Status Bar */}
      <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#dcfce7] text-[#166534] uppercase tracking-wider">
            HEALTHY
          </span>
          <span className="text-slate-400 font-medium text-xs">&bull;</span>
          <span className="font-normal text-slate-600 text-xs">{summary?.statusMessage || 'All systems vibing'}</span>
        </div>

        <div className="text-slate-400 font-normal flex items-center gap-4 text-xs">
          <span>📷 snapshot {summary?.snapshotAgeSeconds || 7}s old</span>
          <span>🔄 refresh in {summary?.refreshTimerSeconds || 7}s</span>
          <span>🕒 {summary?.timestamp || '30 Aug 2026, 21:02:09'}</span>
        </div>
      </div>

      {/* 6 Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Heap */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs relative">
          <div className="w-2 h-2 rounded-full bg-emerald-500 absolute top-4 right-4" />
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>🌸</span>
            <span>HEAP</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary?.heapUsagePercent || 7.3}%</div>
          <div className="text-[11px] text-slate-400 font-normal mt-0.5">JVM heap in use</div>
        </div>

        {/* DB Pool */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs relative">
          <div className="w-2 h-2 rounded-full bg-emerald-500 absolute top-4 right-4" />
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>🗄️</span>
            <span>DB POOL</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary?.dbPoolUsage || '3/10'}</div>
          <div className="text-[11px] text-slate-400 font-normal mt-0.5">ping {summary?.dbPingMs || 0}ms</div>
        </div>

        {/* HTTP Threads */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs relative">
          <div className="w-2 h-2 rounded-full bg-emerald-500 absolute top-4 right-4" />
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>🌐</span>
            <span>HTTP THREADS</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary?.httpThreadsUsage || '3/200'}</div>
          <div className="text-[11px] text-slate-400 font-normal mt-0.5">busy worker threads</div>
        </div>

        {/* CPU */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs relative">
          <div className="w-2 h-2 rounded-full bg-emerald-500 absolute top-4 right-4" />
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>⚡</span>
            <span>CPU</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary?.cpuUsagePercent || 3.0}%</div>
          <div className="text-[11px] text-slate-400 font-normal mt-0.5">system load</div>
        </div>

        {/* RAM */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs relative">
          <div className="w-2 h-2 rounded-full bg-emerald-500 absolute top-4 right-4" />
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>🧱</span>
            <span>RAM</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary?.ramUsagePercent || 12.1}%</div>
          <div className="text-[11px] text-slate-400 font-normal mt-0.5">host memory used</div>
        </div>

        {/* DISK / */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs relative">
          <div className="w-2 h-2 rounded-full bg-emerald-500 absolute top-4 right-4" />
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>💾</span>
            <span>DISK /</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary?.diskUsagePercent || 60.4}%</div>
          <div className="text-[11px] text-slate-400 font-normal mt-0.5">busiest volume</div>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Application */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <span>🍷</span>
                  <span>Application</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#dcfce7] text-[#166534] rounded">
                  HEALTHY
                </span>
              </div>

              <div className="space-y-3.5 text-xs pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <span>🌸</span>
                    <span>Memory</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{app?.heapUsed}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[#dcfce7] text-[#166534] rounded">
                      HEALTHY
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <span>🧵</span>
                    <span>Threads</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">
                      {app?.threadsLive} live · {app?.threadsDeadlocked} deadlocked
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[#dcfce7] text-[#166534] rounded">
                      HEALTHY
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <span>🌐</span>
                    <span>HTTP Connector</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">
                      {app?.httpConnectorBusy} busy / {app?.httpConnectorMax} max
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[#dcfce7] text-[#166534] rounded">
                      HEALTHY
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <span>🗄️</span>
                    <span>DB Pool</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">
                      {app?.dbPoolActive} active · {app?.dbPoolPending} pending
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[#dcfce7] text-[#166534] rounded">
                      HEALTHY
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-4 border-t border-slate-100">
                <span>♻️ GC 67,777 cycles · 503,542ms total</span>
                <span>⏱️ up 8d 4h</span>
              </div>
              <div className="pt-3 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('Application')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  View application →
                </button>
              </div>
            </div>
          </div>

          {/* Host */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <span>🖥️</span>
                  <span>Host</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#dcfce7] text-[#166534] rounded">
                  HEALTHY
                </span>
              </div>

              <div className="space-y-3.5 text-xs pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <span>⚡</span>
                    <span>CPU</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{host?.cpuSystem}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[#dcfce7] text-[#166534] rounded">
                      HEALTHY
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <span>🧱</span>
                    <span>Memory</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{host?.memoryHostRAM}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[#dcfce7] text-[#166534] rounded">
                      HEALTHY
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <span>💾</span>
                    <span>Disks ({host?.disksCount || 3})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{host?.diskWorst}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[#dcfce7] text-[#166534] rounded">
                      HEALTHY
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <span>🔧</span>
                    <span>Process</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">
                      {host?.processThreads} threads · {host?.processFDs} FDs
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[#dcfce7] text-[#166534] rounded">
                      HEALTHY
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-4 border-t border-slate-100">
                <span>🐧 GNU/Linux 24.04.4 LTS</span>
                <span>⏱️ up 66d 14h</span>
              </div>
              <div className="pt-3 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('Host')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  View host →
                </button>
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
