'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ImageOptimizationOverview,
  ImageOptimizationService,
  DEFAULT_OVERVIEW,
} from '@/services/image-optimization-service';
import { Wand2, Pause, Play, RefreshCw, Layers, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';
import dayjs from 'dayjs';

type SquishTab = 'Overview' | 'Priority queue' | 'History' | 'Needs attention' | 'Ledger' | 'Tools';

export default function ImageOptimizationPage() {
  const [activeTab, setActiveTab] = useState<SquishTab>('Overview');
  const [data, setData] = useState<ImageOptimizationOverview>(DEFAULT_OVERVIEW);
  const [loading, setLoading] = useState<boolean>(true);
  const [workerCountInput, setWorkerCountInput] = useState<number>(3);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ImageOptimizationService.getOverview();
      setData(res || DEFAULT_OVERVIEW);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handlePauseResume = async () => {
    if (!data) return;
    await ImageOptimizationService.togglePause(data.status);
    fetchOverview();
  };

  const handleSyncS3 = async () => {
    await ImageOptimizationService.syncFromS3();
    alert('Sync triggered from S3 bucket!');
    fetchOverview();
  };

  const latestFinished = [
    { id: 1, path: 'bpm-feedback/V08N1QOAY9FJ6ALQ5VVKPWEQAN4L07899.jpeg', time: '29 Aug 2026, 17:31', status: 'Failed' },
    { id: 2, path: 'bpm-feedback/KTQ3WZ5RAIPWM0J9ZIS50P7SMRJ604443.jpeg', time: '29 Aug 2026, 17:30', status: 'Failed' },
    { id: 3, path: 'bpm-feedback/F2ZAKBEEGTVRUH9YO6X2LQWT2BC04440.jpeg', time: '29 Aug 2026, 17:30', status: 'Failed' },
    { id: 4, path: 'bpm-feedback/XV0ETSUHO1G0O24SOLFLMWDAJ4UP07498.jpeg', time: '29 Aug 2026, 14:31', status: 'Failed' },
    { id: 5, path: 'bpm-feedback/KL0XMTBXCOPY65DHP1KCX823OFC707068.jpeg', time: '29 Aug 2026, 14:30', status: 'Failed' },
    { id: 6, path: 'bpm-feedback/GPQOEEJ21NGUCX9CBFOU2271ZTP505727.jpeg', time: '29 Aug 2026, 14:30', status: 'Failed' },
    { id: 7, path: 'bpm-feedback/6AL3YGUJ6DON0B9ZHZYI7IJ2VDF106100.jpeg', time: '29 Aug 2026, 14:30', status: 'Failed' },
    { id: 8, path: 'bpm-feedback/3W37RA03QVPNCPXXGY4FD3GUYSB106053.jpeg', time: '26 Aug 2026, 20:30', status: 'Failed' },
  ];

  return (
    <div className="space-y-6 pt-1 pb-20 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🪄</span>
              <h1 className="text-xl font-bold text-slate-900">Squish Studio</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ede9fe] text-[#6d28d9]">
                ⚡ Super User
              </span>
            </div>
            <p className="text-slate-500 text-xs">
              Auto-squishing every image in S3 — smaller files, snappier loads. 🚀
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#dcfce7] text-[#166534]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{data?.status || 'running'}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#dcfce7] text-[#166534]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{data?.speedMode || 'NORMAL'}</span>
            </span>

            <button
              onClick={handlePauseResume}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-full shadow-2xs flex items-center gap-1.5 transition"
            >
              {data?.status === 'running' ? (
                <>
                  <span>⏸️</span> <span>Pause</span>
                </>
              ) : (
                <>
                  <span>▶️</span> <span>Resume</span>
                </>
              )}
            </button>

            <button
              onClick={handleSyncS3}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#585c82] hover:bg-[#484c68] rounded-full shadow-2xs flex items-center gap-1.5 transition"
            >
              <span>⚡</span> <span>Sync from S3</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap gap-2 pt-2">
          {(['Overview', 'Priority queue', 'History', 'Needs attention', 'Ledger', 'Tools'] as SquishTab[]).map(
            (tab) => {
              const icons: { [k: string]: string } = {
                Overview: '⚡',
                'Priority queue': '⚡',
                History: '📁',
                'Needs attention': '🩹',
                Ledger: '📜',
                Tools: '🔧',
              };
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-full transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#ede9fe] text-[#6d28d9]'
                      : 'bg-[#f1f5f9] text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{icons[tab] || '•'}</span>
                  <span>{tab}</span>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Hero Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Squished */}
        <div className="lg:col-span-2 bg-[#f8fcf9] p-6 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
            <span>TOTAL SQUISHED</span>
            <span>📊</span>
          </div>
          <div className="text-4xl font-extrabold text-slate-900">
            {data?.totalSquishedGB ?? 13.7} GB
          </div>
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#10b981] text-white">
              {data?.percentageSmaller ?? 65.22}% smaller
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200 shadow-2xs">
              ⚡ ~{data?.timeFasterPerImageSeconds ?? 29316.9}s faster / image on 4G
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-emerald-700 border border-emerald-200 shadow-2xs">
              ✅ {data?.totalOptimizedCount ?? 29982} optimized
            </span>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>OVERALL PROGRESS</span>
            <span className="text-slate-900 font-extrabold">{data?.overallProgressPercent ?? 100}%</span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#585c82] h-full rounded-full transition-all duration-500"
              style={{ width: `${data?.overallProgressPercent ?? 100}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] font-medium text-slate-500">
            <span>⚡ {data?.priorityQueueCount ?? 0} priority</span>
            <span>📦 {data?.backlogCount ?? 0} backlog</span>
            <span>🖼️ {data?.totalImagesCount ?? 40181} total</span>
          </div>
        </div>
      </div>

      {/* Row Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Completed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 uppercase">
            <span>✅</span> <span>COMPLETED</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{data?.completedCount ?? 29982}</div>
        </div>

        {/* Priority Queue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase">
            <span>⚡</span> <span>PRIORITY QUEUE</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{data?.priorityQueueCount ?? 0}</div>
          <div className="text-[10px] text-slate-400 font-normal">incoming, optimized first</div>
        </div>

        {/* Backlog */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase">
            <span>📦</span> <span>BACKLOG</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{data?.backlogCount ?? 0}</div>
        </div>

        {/* Needs Attention */}
        <div className="bg-[#fffdf7] p-4 rounded-xl border border-[#fed7aa]/60 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#b45309] uppercase">
            <span>🩹</span> <span>NEEDS ATTENTION</span>
          </div>
          <div className="text-2xl font-extrabold text-[#9a3412]">{data?.needsAttentionCount ?? 10199}</div>
          <div className="text-[10px] text-[#b45309]/80 font-normal">failed · skipped · unsupported</div>
        </div>

        {/* Active Workers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase">
            <span>🐝</span> <span>ACTIVE WORKERS</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {data?.activeWorkers ?? 0} / {data?.maxWorkers ?? 10}
          </div>
        </div>
      </div>

      {/* Ledger & Savings Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ledger Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <span>🎯</span>
            <span>Ledger by state</span>
          </div>

          <div className="flex items-center justify-between gap-8 pt-2">
            {/* Donut graphic */}
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-emerald-500"
                  strokeWidth="5"
                  strokeDasharray="74.6, 100"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-slate-400"
                  strokeWidth="5"
                  strokeDasharray="24.5, 100"
                  strokeDashoffset="-74.6"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-rose-500"
                  strokeWidth="5"
                  strokeDasharray="0.6, 100"
                  strokeDashoffset="-99.1"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-purple-600"
                  strokeWidth="5"
                  strokeDasharray="0.3, 100"
                  strokeDashoffset="-99.7"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>

            <div className="space-y-2 text-xs flex-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> completed
                </span>
                <span className="font-semibold text-slate-900">{data?.ledger?.completed ?? 29982}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> skipped
                </span>
                <span className="font-semibold text-slate-900">{data?.ledger?.skipped ?? 9843}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> failed
                </span>
                <span className="font-semibold text-slate-900">{data?.ledger?.failed ?? 255}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> unsupported
                </span>
                <span className="font-semibold text-slate-900">{data?.ledger?.unsupported ?? 101}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Savings Over Time Graph */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>📈</span>
              <span>Savings over time</span>
            </div>
            <span className="text-xs text-slate-400 font-normal">bytes saved / day</span>
          </div>

          <div className="h-28 flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 80">
              <path
                d="M 0 0 L 10 70 L 300 75 L 300 80 L 0 80 Z"
                fill="#f1f5f9"
              />
              <path
                d="M 0 0 L 10 70 L 300 75"
                fill="none"
                stroke="#64748b"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          <div className="text-[11px] text-slate-400 font-normal">
            54 active days · peak 6.8 GB/day
          </div>
        </div>
      </div>

      {/* Row 2: Saved by format & Load-time saved */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saved by format */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <span>🎨</span>
            <span>Saved by format</span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" /> JPEG
                </span>
                <span className="text-slate-700">7.5 GB · 18880</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full w-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" /> PNG
                </span>
                <span className="text-slate-700">6.1 GB · 10952</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full rounded-full w-[81%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> GIF
                </span>
                <span className="text-slate-700">23 MB · 134</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-400 h-full rounded-full w-[10%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> SVG
                </span>
                <span className="text-slate-700">1.1 KB · 16</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full w-[3%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Load-time saved / image */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>⏱️</span>
              <span>Load-time saved / image</span>
            </div>

            <div className="space-y-3 pt-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800">▲ 3G (0.4 Mbps)</span>
                  <span className="text-slate-700 font-bold">~293169.1s</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-slate-700 h-full rounded-full w-full" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800">📶 4G (4 Mbps)</span>
                  <span className="text-slate-700 font-bold">~29316.9s</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full w-[40%]" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800">🚀 Broadband (20 Mbps)</span>
                  <span className="text-slate-700 font-bold">~5863.4s</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-slate-300 h-full rounded-full w-[15%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-normal pt-2">
            Modeled as transfer size ÷ bandwidth across representative speeds.
          </div>
        </div>
      </div>

      {/* Server Pressure */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
            <span>📉</span>
            <span>Server pressure</span>
          </div>
          <span className="text-[11px] text-slate-400">8 cores · load 0.19 · live from Diagnostics</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-1 text-xs">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-slate-600 font-medium">
              <span>⚡ System load</span>
              <span className="font-bold text-slate-800">0.2%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[2%]" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-slate-600 font-medium">
              <span>⚙️ Process CPU</span>
              <span className="font-bold text-slate-800">11.1%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[11%]" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-slate-600 font-medium">
              <span>🧱 RAM</span>
              <span className="font-bold text-slate-800">11.7%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[12%]" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-slate-600 font-medium">
              <span>☕ JVM heap</span>
              <span className="font-bold text-slate-800">3.1%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[3%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Live Now & Workers */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <span>🔴</span>
          <span>Live now</span>
        </div>

        <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
          <span>🍿</span>
          <span>Nothing in flight right now — the daemon grabs the next image automatically.</span>
        </div>

        {/* Daemon info card */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 w-full max-w-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <span>🐝</span>
              <span>daemon</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">idle</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-3">
            <span>✓ 695 done</span>
            <span>📦 0.1 MB</span>
          </div>
        </div>

        {/* Worker Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <span>🐝</span>
            <span>0 / 10 workers</span>
          </span>

          <input
            type="number"
            value={workerCountInput}
            onChange={(e) => setWorkerCountInput(parseInt(e.target.value) || 0)}
            className="w-16 px-2.5 py-1 text-xs border border-slate-300 rounded-md outline-none text-slate-800 font-semibold"
          />

          <button
            type="button"
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#585c82] hover:bg-[#484c68] rounded-md shadow-2xs flex items-center gap-1.5 transition"
          >
            <span>Deploy</span>
            <span>🚀</span>
          </button>

          <button
            type="button"
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md shadow-2xs transition"
          >
            Stop all
          </button>
        </div>
      </div>

      {/* Latest 10 Finished */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <span>📑</span>
          <span>Latest 10 finished</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {latestFinished.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400 text-xs">
                  🖼️
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fee2e2] text-[#991b1b] shrink-0">
                  ✕ {item.status}
                </span>
                <span className="font-mono text-slate-700 text-xs truncate max-w-md">
                  {item.path}
                </span>
              </div>

              <div className="text-slate-400 text-xs whitespace-nowrap flex items-center gap-1.5">
                <span>🕒</span>
                <span>{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
