'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ImpactSummary,
  ImpactCalculationResult,
  ImpactSkippedItem,
  ImpactService,
} from '@/services/impact-service';
import {
  Ruler,
  Leaf,
  Droplet,
  Wrench,
  Users,
  Shirt,
  Clock,
  RotateCw,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import dayjs from 'dayjs';

interface OrderImpactDashboardProps {
  orderId: number;
  custom?: boolean;
}

interface ImpactMetricCard {
  label: string;
  value: number | null | undefined;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const OrderImpactDashboard: React.FC<OrderImpactDashboardProps> = ({
  orderId,
  custom = false,
}) => {
  const [impact, setImpact] = useState<ImpactSummary>({
    orderId,
    configurationError: null,
    completeItems: 0,
    partialItems: 0,
    fabricMeters: 0,
    co2OffsetKg: 0,
    waterSavedLitres: 0,
    artisanHours: 0,
    womenArtisanHours: 0,
    stitchingHours: 0,
    womenStitchingHours: 0,
    totalWorkHours: 0,
    items: [],
  });

  const [lastCalculation, setLastCalculation] = useState<ImpactCalculationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const loadImpact = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = custom
        ? await ImpactService.getCustomOrderImpact(orderId)
        : await ImpactService.getOrderImpact(orderId);
      setImpact(
        res || {
          orderId,
          configurationError: null,
          completeItems: 0,
          partialItems: 0,
          fabricMeters: 0,
          co2OffsetKg: 0,
          waterSavedLitres: 0,
          artisanHours: 0,
          womenArtisanHours: 0,
          stitchingHours: 0,
          womenStitchingHours: 0,
          totalWorkHours: 0,
          items: [],
        }
      );
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to load order impact' });
    } finally {
      setLoading(false);
    }
  }, [orderId, custom]);

  useEffect(() => {
    loadImpact();
  }, [loadImpact]);

  const handleCalculateImpact = async () => {
    if (!orderId || calculating) return;
    setCalculating(true);
    setToastMessage(null);

    try {
      const res = custom
        ? await ImpactService.triggerCustomOrderImpact(orderId)
        : await ImpactService.triggerOrderImpact(orderId);

      setLastCalculation(res);

      if (res.configurationError) {
        setToastMessage({ type: 'error', text: res.configurationError });
      } else {
        setToastMessage({
          type: 'success',
          text: `Impact recalculated. Complete: ${res.complete}, Pending: ${res.partial}`,
        });
        await loadImpact();
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to calculate impact' });
    } finally {
      setCalculating(false);
    }
  };

  const metricCards: ImpactMetricCard[] = [
    { label: 'FABRIC METERS', value: impact.fabricMeters, unit: 'm', icon: Ruler },
    { label: 'CO2 OFFSET', value: impact.co2OffsetKg, unit: 'kg', icon: Leaf },
    { label: 'WATER SAVED', value: impact.waterSavedLitres, unit: 'L', icon: Droplet },
    { label: 'ARTISAN HOURS', value: impact.artisanHours, unit: 'hrs', icon: Wrench },
    { label: 'WOMEN ARTISAN HOURS', value: impact.womenArtisanHours, unit: 'hrs', icon: Users },
    { label: 'STITCHING HOURS', value: impact.stitchingHours, unit: 'hrs', icon: Shirt },
    { label: 'WOMEN STITCHING HOURS', value: impact.womenStitchingHours, unit: 'hrs', icon: Users },
    { label: 'TOTAL WORK HOURS', value: impact.totalWorkHours, unit: 'hrs', icon: Clock },
  ];

  const skippedItems: ImpactSkippedItem[] = lastCalculation?.skippedItems || [];
  const hasImpactRows = !!impact.items && impact.items.length > 0;
  const isEmptyImpact =
    !hasImpactRows &&
    impact.fabricMeters === 0 &&
    impact.co2OffsetKg === 0 &&
    impact.waterSavedLitres === 0 &&
    impact.artisanHours === 0 &&
    impact.womenArtisanHours === 0 &&
    impact.stitchingHours === 0 &&
    impact.womenStitchingHours === 0 &&
    impact.totalWorkHours === 0;

  const formatMetric = (val: number | null | undefined, unit: string = '') => {
    if (val === null || typeof val === 'undefined') return 'N/A';
    const formatted = val.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    return unit ? `${formatted} ${unit}` : formatted;
  };

  const formatPendingReason = (reason: string | null) => {
    return reason
      ? reason
          .split(',')
          .map((v) => v.replace(/_/g, ' ').toLowerCase())
          .join(', ')
      : '';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Toast banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-semibold underline ml-4 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            IMPACT DASHBOARD
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            {custom ? 'Custom order impact' : 'Order impact'}
          </h2>
        </div>

        <button
          onClick={handleCalculateImpact}
          disabled={calculating || loading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-xs transition disabled:opacity-50"
        >
          <RotateCw className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
          <span>{calculating ? 'Recalculating...' : 'Recalculate impact'}</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
          <span className="text-sm font-medium text-slate-500">Loading order impact metrics...</span>
        </div>
      ) : (
        <>
          {/* Configuration Error Alert */}
          {impact.configurationError && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-sm text-amber-800">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>{formatPendingReason(impact.configurationError)}</span>
            </div>
          )}

          {/* Empty Impact Alert */}
          {isEmptyImpact && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-slate-200 rounded-xl">
              <Leaf className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No impact is available for this order yet</p>
            </div>
          )}

          {/* 8 Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {metricCards.map((card, i) => {
              const IconComp = card.icon;
              return (
                <div
                  key={i}
                  className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 flex items-center gap-3.5"
                >
                  <div className="w-10 h-10 rounded-lg bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {card.label}
                    </p>
                    <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {formatMetric(card.value, card.unit)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Item Impact Table */}
          {hasImpactRows && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-800">
                <span>ORDER ITEM IMPACT</span>
                <span className="text-xs text-slate-500 font-normal">
                  {impact.completeItems} COMPLETE, {impact.partialItems} PENDING
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-max text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200 text-left">
                      <th className="px-3 py-2.5">Workflow</th>
                      <th className="px-3 py-2.5">Order Item</th>
                      <th className="px-3 py-2.5">Type</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Pending Reason</th>
                      <th className="px-3 py-2.5">Fabric</th>
                      <th className="px-3 py-2.5">CO2</th>
                      <th className="px-3 py-2.5">Water</th>
                      <th className="px-3 py-2.5">Artisan</th>
                      <th className="px-3 py-2.5">Women Artisan</th>
                      <th className="px-3 py-2.5">Stitching</th>
                      <th className="px-3 py-2.5">Women Stitching</th>
                      <th className="px-3 py-2.5">Total</th>
                      <th className="px-3 py-2.5">Version</th>
                      <th className="px-3 py-2.5">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {impact.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3 py-2.5 font-medium text-slate-700">
                          {item.workflowId ? `#${item.workflowId}` : 'Pending'}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-700">
                          #{item.orderItemId}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 font-semibold text-[10px] bg-slate-100 text-slate-700 rounded border border-slate-200">
                            {item.productType}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`px-2 py-0.5 font-semibold text-[10px] rounded border ${
                              item.calculationStatus === 'COMPLETE'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-amber-100 text-amber-700 border-amber-200'
                            }`}
                          >
                            {item.calculationStatus}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 italic">
                          {formatPendingReason(item.pendingReason) || '-'}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 font-medium">
                          {formatMetric(item.fabricMeters, 'm')}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 font-medium">
                          {formatMetric(item.co2OffsetKg, 'kg')}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 font-medium">
                          {formatMetric(item.waterSavedLitres, 'L')}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 font-medium">
                          {formatMetric(item.artisanHours, 'hrs')}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 font-medium">
                          {formatMetric(item.womenArtisanHours, 'hrs')}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 font-medium">
                          {formatMetric(item.stitchingHours, 'hrs')}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 font-medium">
                          {formatMetric(item.womenStitchingHours, 'hrs')}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-slate-900">
                          {formatMetric(item.totalWorkHours, 'hrs')}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">v{item.assumptionVersion}</td>
                        <td className="px-3 py-2.5 text-slate-500">
                          {item.updatedAt ? dayjs(item.updatedAt).format('DD-MM-YYYY h:mm A') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Skipped Workflows */}
          {skippedItems.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <span className="text-sm font-semibold text-slate-800">SKIPPED WORKFLOWS</span>
              <div className="space-y-2">
                {skippedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-700"
                  >
                    <div className="flex gap-3">
                      {item.workflowId && <span className="font-semibold">Workflow #{item.workflowId}</span>}
                      {item.orderItemId && <span className="font-semibold">Order Item #{item.orderItemId}</span>}
                    </div>
                    <span className="text-slate-500 italic">{item.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
