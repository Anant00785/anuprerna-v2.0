'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ImpactTotals,
  OrderImpactRow,
  OrderStatus,
  ImpactService,
  ImpactSummary,
} from '@/services/impact-service';
import { ImpactOverviewHero } from '@/components/manage-impact/ImpactOverviewHero';
import { ChevronRight, Loader2 } from 'lucide-react';

type ImpactTab = 'regular' | 'custom';

const STATUS_OPTIONS: OrderStatus[] = [
  OrderStatus.PROCESSING,
  OrderStatus.PARTIALLY_DISPATCHED,
  OrderStatus.IN_TRANSIT,
  OrderStatus.DISPATCHED,
  OrderStatus.DELIVERED,
];

const emptyTotals = (): ImpactTotals => ({
  orderCount: 0,
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
});

export default function ManageImpactPage() {
  const [activeTab, setActiveTab] = useState<ImpactTab>('regular');
  const [status, setStatus] = useState<OrderStatus>(OrderStatus.PROCESSING);

  const [rows, setRows] = useState<OrderImpactRow[]>([]);
  const [totals, setTotals] = useState<ImpactTotals>(emptyTotals());
  const [loading, setLoading] = useState<boolean>(true);

  const formatStatus = (st: string) => {
    return st
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  const formatNumber = (val: number | null | undefined) => {
    return Math.round(val || 0).toLocaleString('en-US');
  };

  const completeness = (row: OrderImpactRow) => {
    if (row.state !== 'loaded' || !row.summary) return '—';
    const total = row.summary.completeItems + row.summary.partialItems;
    if (total === 0) return 'No items';
    if (row.summary.partialItems === 0) return 'Complete';
    return `${row.summary.completeItems}/${total} complete`;
  };

  const isCustom = activeTab === 'custom';

  const contextLabel = React.useMemo(() => {
    const scope = isCustom ? 'custom orders' : `${formatStatus(status).toLowerCase()} orders`;
    return rows.length > 0 ? `Across the ${rows.length} most recent ${scope}` : '';
  }, [isCustom, status, rows.length]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setRows([]);
    setTotals(emptyTotals());

    try {
      let rawOrders: any[] = [];
      if (isCustom) {
        rawOrders = await ImpactService.getCustomOrderPreviewList(0, 20);
      } else {
        rawOrders = await ImpactService.getOrderPreviewList(0, 20, status);
      }

      if (!rawOrders || rawOrders.length === 0) {
        setLoading(false);
        return;
      }

      const initialRows: OrderImpactRow[] = rawOrders.map((ord) => ({
        orderId: ord.id || ord.orderId,
        customerName: ord.name || ord.customerName || ord.email || '—',
        orderStatus: ord.orderStatus || ord.status || status,
        createdAt: ord.createdAt || Date.now(),
        custom: isCustom,
        summary: null,
        state: 'loading',
      }));

      setRows(initialRows);

      let pending = initialRows.length;
      let currentTotals = emptyTotals();

      initialRows.forEach(async (row, idx) => {
        try {
          const summary: ImpactSummary = isCustom
            ? await ImpactService.getCustomOrderImpact(row.orderId)
            : await ImpactService.getOrderImpact(row.orderId);

          initialRows[idx].summary = summary;
          initialRows[idx].state = 'loaded';

          if (summary) {
            currentTotals = {
              orderCount: currentTotals.orderCount + 1,
              completeItems: currentTotals.completeItems + (summary.completeItems || 0),
              partialItems: currentTotals.partialItems + (summary.partialItems || 0),
              fabricMeters: currentTotals.fabricMeters + (summary.fabricMeters || 0),
              co2OffsetKg: currentTotals.co2OffsetKg + (summary.co2OffsetKg || 0),
              waterSavedLitres: currentTotals.waterSavedLitres + (summary.waterSavedLitres || 0),
              artisanHours: currentTotals.artisanHours + (summary.artisanHours || 0),
              womenArtisanHours: currentTotals.womenArtisanHours + (summary.womenArtisanHours || 0),
              stitchingHours: currentTotals.stitchingHours + (summary.stitchingHours || 0),
              womenStitchingHours:
                currentTotals.womenStitchingHours + (summary.womenStitchingHours || 0),
              totalWorkHours: currentTotals.totalWorkHours + (summary.totalWorkHours || 0),
            };
            setTotals({ ...currentTotals });
          }
        } catch {
          initialRows[idx].state = 'error';
        } finally {
          pending--;
          setRows([...initialRows]);
          if (pending <= 0) {
            setLoading(false);
          }
        }
      });
    } catch {
      setLoading(false);
    }
  }, [isCustom, status]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6 pt-2 pb-20 max-w-7xl mx-auto">
      <ImpactOverviewHero totals={totals} loading={loading} contextLabel={contextLabel} />

      <section className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('regular')}
              className={`text-xs font-semibold pb-2.5 transition-colors relative ${
                !isCustom
                  ? 'text-slate-900 border-b-2 border-slate-900 font-bold'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Regular orders
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`text-xs font-semibold pb-2.5 transition-colors relative ${
                isCustom
                  ? 'text-slate-900 border-b-2 border-slate-900 font-bold'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Custom orders
            </button>
          </div>

          {!isCustom && (
            <div className="flex items-center gap-2 pb-2 text-xs">
              <span className="text-slate-400 font-medium">Showing</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-md text-slate-800 font-semibold focus:outline-none focus:border-slate-400 text-xs shadow-2xs"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {formatStatus(opt)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading && rows.length === 0 ? (
          <div className="p-16 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#585c82] animate-spin" />
            <span className="text-xs font-medium text-slate-500">Measuring impact data...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
            No orders to account for in this view yet.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[11px] bg-slate-50/50">
                    <th className="px-5 py-3.5 text-left whitespace-nowrap">ORDER</th>
                    <th className="px-5 py-3.5 text-left whitespace-nowrap">CUSTOMER</th>
                    <th className="px-5 py-3.5 text-right whitespace-nowrap">CLOTH</th>
                    <th className="px-5 py-3.5 text-right whitespace-nowrap">CARBON</th>
                    <th className="px-5 py-3.5 text-right whitespace-nowrap">WATER</th>
                    <th className="px-5 py-3.5 text-right whitespace-nowrap">HANDWORK</th>
                    <th className="px-5 py-3.5 text-left whitespace-nowrap">STATUS</th>
                    <th className="px-4 py-3.5 text-center whitespace-nowrap"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {rows.map((row) => {
                    const detailHref = row.custom
                      ? `/manage-impact/custom-detail/${row.orderId}`
                      : `/manage-impact/detail/${row.orderId}`;

                    return (
                      <tr key={row.orderId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 font-semibold text-slate-900 whitespace-nowrap">
                          #{row.orderId}
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-800 whitespace-nowrap">
                          {row.customerName || '—'}
                        </td>

                        {row.state === 'loaded' && row.summary ? (
                          <>
                            <td className="px-5 py-4 text-right font-medium text-slate-700 whitespace-nowrap">
                              {formatNumber(row.summary.fabricMeters)} m
                            </td>
                            <td className="px-5 py-4 text-right font-medium text-slate-700 whitespace-nowrap">
                              {formatNumber(row.summary.co2OffsetKg)} kg
                            </td>
                            <td className="px-5 py-4 text-right font-medium text-slate-700 whitespace-nowrap">
                              {formatNumber(row.summary.waterSavedLitres)} L
                            </td>
                            <td className="px-5 py-4 text-right font-medium text-slate-700 whitespace-nowrap">
                              {formatNumber(row.summary.totalWorkHours)} hrs
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              {(() => {
                                const statusText = completeness(row);
                                const isGreen = statusText === 'Complete' || statusText === 'No items';
                                return (
                                  <span
                                    className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
                                      isGreen
                                        ? 'border-emerald-300 text-emerald-700 bg-emerald-50/50'
                                        : 'border-slate-300 text-slate-500 bg-slate-50/50'
                                    }`}
                                  >
                                    {statusText}
                                  </span>
                                );
                              })()}
                            </td>
                          </>
                        ) : (
                          <>
                            <td colSpan={4} className="px-5 py-4 text-right text-slate-400 text-xs italic">
                              {row.state === 'error' ? 'Unavailable' : 'Measuring…'}
                            </td>
                            <td />
                          </>
                        )}

                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <Link
                            href={detailHref}
                            className="inline-flex p-1 text-slate-400 hover:text-slate-900 rounded transition"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
