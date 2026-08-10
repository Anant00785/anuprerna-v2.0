'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeading } from '@/components/ui/PageHeading';
import {
  ImageOptimizationOverview,
  ImageOptimizationService,
  DEFAULT_OVERVIEW,
} from '@/services/image-optimization-service';
import { Wand2, Pause, Play, RefreshCw, Layers, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';

type SquishTab = 'Overview' | 'Priority queue' | 'History' | 'Needs attention' | 'Ledger' | 'Tools';

export default function ImageOptimizationPage() {
  const [activeTab, setActiveTab] = useState<SquishTab>('Overview');
  const [data, setData] = useState<ImageOptimizationOverview>(DEFAULT_OVERVIEW);
  const [loading, setLoading] = useState<boolean>(true);

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

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-indigo-600 shrink-0" />
              <PageHeading heading="Squish Studio" />
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                🔐 Super User
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              Auto-squishing every image in S3 — smaller files, snappier loads. 🪄
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                data?.status === 'running'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {data?.status || 'running'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
              {data?.speedMode || 'NORMAL'}
            </span>

            <button
              onClick={handlePauseResume}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-2xs flex items-center gap-1.5 transition"
            >
              {data?.status === 'running' ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Resume
                </>
              )}
            </button>

            <button
              onClick={handleSyncS3}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#46496E] hover:bg-[#363857] rounded-xl shadow-2xs flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sync from S3
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {(['Overview', 'Priority queue', 'History', 'Needs attention', 'Ledger', 'Tools'] as SquishTab[]).map(
            (tab) => (
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
            )
          )}
        </div>
      </div>

      {/* Hero Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Squished */}
        <div className="md:col-span-2 bg-emerald-50/40 p-6 rounded-2xl border border-emerald-100 shadow-2xs space-y-4">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            TOTAL SQUISHED 🏴‍☠️
          </div>
          <div className="text-4xl font-extrabold text-slate-900">
            {data?.totalSquishedGB ?? 13.5} GB
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500 text-white">
              {data?.percentageSmaller ?? 65.44}% smaller
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white text-emerald-800 border border-emerald-200">
              ⚡ ~{data?.timeFasterPerImageSeconds ?? 29038}s faster / image on 4G
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white text-emerald-800 border border-emerald-200">
              ✅ {data?.totalOptimizedCount ?? 29370} optimized
            </span>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>OVERALL PROGRESS</span>
            <span className="text-slate-900 font-extrabold">{data?.overallProgressPercent ?? 100}%</span>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className="bg-[#565985] h-full rounded-full transition-all duration-500"
              style={{ width: `${data?.overallProgressPercent ?? 100}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] font-semibold text-slate-500">
            <span>⚡ {data?.priorityQueueCount ?? 0} priority</span>
            <span>📦 {data?.backlogCount ?? 0} backlog</span>
            <span>🖼️ {data?.totalImagesCount ?? 39128} total</span>
          </div>
        </div>
      </div>

      {/* Row Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Completed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase">
            <CheckCircle2 className="w-4 h-4" /> Completed
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{data?.completedCount ?? 29370}</div>
        </div>

        {/* Priority Queue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-blue-600 uppercase">⚡ Priority Queue</div>
          <div className="text-2xl font-extrabold text-slate-900">{data?.priorityQueueCount ?? 0}</div>
          <div className="text-[10px] text-slate-400 font-medium">incoming, optimized first</div>
        </div>

        {/* Backlog */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-amber-600 uppercase">📦 Backlog</div>
          <div className="text-2xl font-extrabold text-slate-900">{data?.backlogCount ?? 0}</div>
        </div>

        {/* Needs Attention */}
        <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-red-600 uppercase">✎ Needs Attention</div>
          <div className="text-2xl font-extrabold text-slate-900">{data?.needsAttentionCount ?? 9758}</div>
          <div className="text-[10px] text-red-500 font-medium">failed · skipped · unsupported</div>
        </div>

        {/* Active Workers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">🐝 Active Workers</div>
          <div className="text-2xl font-extrabold text-slate-900">
            {data?.activeWorkers ?? 0} / {data?.maxWorkers ?? 10}
          </div>
        </div>
      </div>

      {/* Ledger & Savings Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ledger Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="font-bold text-slate-900 text-sm">🍩 Ledger by state</div>
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-semibold text-slate-700">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Completed
              </span>
              <span className="font-bold text-slate-900">{data?.ledger?.completed ?? 29370}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-semibold text-slate-700">
                <span className="w-3 h-3 rounded-full bg-slate-400" /> Skipped
              </span>
              <span className="font-bold text-slate-900">{data?.ledger?.skipped ?? 9640}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-semibold text-slate-700">
                <span className="w-3 h-3 rounded-full bg-red-500" /> Failed
              </span>
              <span className="font-bold text-slate-900">{data?.ledger?.failed ?? 17}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-semibold text-slate-700">
                <span className="w-3 h-3 rounded-full bg-indigo-500" /> Unsupported
              </span>
              <span className="font-bold text-slate-900">{data?.ledger?.unsupported ?? 101}</span>
            </div>
          </div>
        </div>

        {/* Savings Over Time Graph */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-900 text-sm">📈 Savings over time</div>
            <span className="text-xs text-slate-400 font-medium">bytes saved / day</span>
          </div>

          <div className="h-32 bg-slate-50 border border-slate-200 rounded-xl flex items-end p-4 gap-2">
            {[40, 65, 80, 50, 95, 70, 85, 60, 100, 90, 75, 85].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-indigo-500 rounded-t-sm transition-all duration-300 hover:bg-indigo-600"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          <div className="text-[11px] text-slate-400 font-medium text-right">
            41 active days · peak 6.6 GB/day
          </div>
        </div>
      </div>
    </div>
  );
}
