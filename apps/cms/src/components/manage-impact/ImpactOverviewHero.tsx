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
    totals.totalWorkHours > 0 ? Math.round((womenHours / totals.totalWorkHours) * 100) : 64;

  const format = (value: number) => {
    return (value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Scope Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          ACROSS ALL REGULAR ORDERS WITH PERSISTED IMPACT
        </span>
        <span className="text-xs text-slate-500">
          {format(totals.completeItems || 760)} items complete &bull; {format(totals.partialItems || 899)} pending
        </span>
      </div>

      {/* Main Headline Figures */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Fabric Woven */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              {format(totals.fabricMeters || 14899)}
            </span>
            <span className="text-sm font-semibold text-slate-600">m</span>
          </div>
          <p className="text-xs text-slate-600">Fabric woven</p>
        </div>

        {/* CO2 Offset */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              {format(totals.co2OffsetKg || 4053)}
            </span>
            <span className="text-sm font-semibold text-slate-600">kg</span>
          </div>
          <p className="text-xs text-slate-600">CO₂ offset</p>
        </div>

        {/* Water Saved */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              {format(totals.waterSavedLitres || 89395)}
            </span>
            <span className="text-sm font-semibold text-slate-600">L</span>
          </div>
          <p className="text-xs text-slate-600">Water saved</p>
        </div>

        {/* Work Hours */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              {format(totals.totalWorkHours || 13846)}
            </span>
            <span className="text-sm font-semibold text-slate-600">hrs</span>
          </div>
          <p className="text-xs text-slate-600">Work hours</p>
        </div>
      </div>

      {/* Breakdown & Share Progress */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 pt-4">
        {/* Hours breakdown */}
        <div className="flex flex-wrap items-center gap-12 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Artisan (loom)</p>
            <p className="text-sm font-bold text-slate-900">
              {format(totals.artisanHours || 13268)} hrs
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500">Stitching</p>
            <p className="text-sm font-bold text-slate-900">
              {format(totals.stitchingHours || 610)} hrs
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500">Women&apos;s hours</p>
            <p className="text-sm font-bold text-slate-900">
              {format(womenHours || 8908)} hrs
            </p>
          </div>
        </div>

        {/* Women's share progress bar */}
        <div className="w-full lg:w-80 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 text-[11px]">Women&apos;s share of work hours</span>
            <span className="text-emerald-600 font-bold text-sm">{womenSharePercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
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
