'use client';

import React from 'react';
import { ImpactTotals } from '@/services/impact-service';

interface ImpactOverviewHeroProps {
  totals: ImpactTotals;
  loading: boolean;
  contextLabel: string;
}

export const ImpactOverviewHero: React.FC<ImpactOverviewHeroProps> = ({
  totals,
  loading,
  contextLabel,
}) => {
  const womenHours = totals.womenArtisanHours + totals.womenStitchingHours;
  const womenSharePercent =
    totals.totalWorkHours > 0 ? Math.round((womenHours / totals.totalWorkHours) * 100) : 0;

  const format = (value: number) => {
    return (value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-6 transition-opacity duration-200 ${
        loading ? 'opacity-60 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Scope Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {contextLabel || 'No orders in this view'}
        </span>
        {totals.orderCount > 0 && (
          <span className="text-xs font-medium text-slate-500">
            <strong className="text-slate-700">{format(totals.completeItems)}</strong> items complete &middot;{' '}
            <strong className="text-slate-700">{format(totals.partialItems)}</strong> pending
          </span>
        )}
      </div>

      {/* Main Headline Figures */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:divide-x divide-slate-100">
        {/* Fabric Woven */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              {format(totals.fabricMeters)}
            </span>
            <span className="text-base font-semibold text-slate-500">m</span>
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fabric woven</p>
        </div>

        {/* CO2 Offset */}
        <div className="space-y-1 lg:pl-6">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              {format(totals.co2OffsetKg)}
            </span>
            <span className="text-base font-semibold text-slate-500">kg</span>
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">CO₂ offset</p>
        </div>

        {/* Water Saved */}
        <div className="space-y-1 lg:pl-6">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              {format(totals.waterSavedLitres)}
            </span>
            <span className="text-base font-semibold text-slate-500">L</span>
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Water saved</p>
        </div>

        {/* Work Hours */}
        <div className="space-y-1 lg:pl-6">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              {format(totals.totalWorkHours)}
            </span>
            <span className="text-base font-semibold text-slate-500">hrs</span>
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Work hours</p>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Breakdown & Share Progress */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-2">
        {/* Hours breakdown */}
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="space-y-0.5">
            <p className="text-xs text-slate-500 font-medium">Artisan (loom)</p>
            <p className="text-base font-bold text-slate-800">{format(totals.artisanHours)} hrs</p>
          </div>

          <div className="h-8 w-px bg-slate-100 hidden sm:block" />

          <div className="space-y-0.5">
            <p className="text-xs text-slate-500 font-medium">Stitching</p>
            <p className="text-base font-bold text-slate-800">{format(totals.stitchingHours)} hrs</p>
          </div>

          <div className="h-8 w-px bg-slate-100 hidden sm:block" />

          <div className="space-y-0.5">
            <p className="text-xs text-slate-500 font-medium">Women&apos;s hours</p>
            <p className="text-base font-bold text-slate-800">{format(womenHours)} hrs</p>
          </div>
        </div>

        {/* Women's share progress bar */}
        <div className="w-full lg:w-72 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-600">Women&apos;s share of work hours</span>
            <span className="text-emerald-600 font-bold text-sm">{womenSharePercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(womenSharePercent, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
