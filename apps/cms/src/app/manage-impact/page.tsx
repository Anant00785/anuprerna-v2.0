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
    return (val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
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
    <div className="space-y-8 pb-12">
      {/* Masthead */}
      <header className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">OPERATIONS</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Impact Factor
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          Environmental savings and artisan work-hours, rolled up from persisted impact data. Switch tab
          or status to change the sample below.
        </p>
      </header>

      {/* Hero Rollup Overview */}
      <ImpactOverviewHero totals={totals} loading={loading} contextLabel={contextLabel} />

      {/* Controls & Order Table */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('regular')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                !isCustom
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Regular orders
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                isCustom
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Custom orders
            </button>
          </div>

          {/* Status filter dropdown */}
          {!isCustom && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 font-medium">Showing</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
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

        {/* Loader */}
        {loading && rows.length === 0 ? (
          <div className="p-16 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
            <span className="text-sm font-medium text-slate-500">Measuring impact data...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
            No orders to account for in this view yet.
          </div>
        ) : (
          /* Table */
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold uppercase text-xs tracking-wider border-b border-slate-200">
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-right">Cloth</th>
                    <th className="px-4 py-3 text-right">Carbon</th>
                    <th className="px-4 py-3 text-right">Water</th>
                    <th className="px-4 py-3 text-right">Handwork</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rows.map((row) => {
                    const detailHref = row.custom
                      ? `/manage-impact/custom-detail/${row.orderId}`
                      : `/manage-impact/detail/${row.orderId}`;

                    return (
                      <tr key={row.orderId} className="hover:bg-slate-50/80 transition-colors">
                        {/* Order ID */}
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          #{row.orderId}
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {row.customerName || '—'}
                        </td>

                        {row.state === 'loaded' && row.summary ? (
                          <>
                            {/* Cloth */}
                            <td className="px-4 py-3 text-right font-medium text-slate-700">
                              {formatNumber(row.summary.fabricMeters)} m
                            </td>
                            {/* Carbon */}
                            <td className="px-4 py-3 text-right font-medium text-slate-700">
                              {formatNumber(row.summary.co2OffsetKg)} kg
                            </td>
                            {/* Water */}
                            <td className="px-4 py-3 text-right font-medium text-slate-700">
                              {formatNumber(row.summary.waterSavedLitres)} L
                            </td>
                            {/* Handwork */}
                            <td className="px-4 py-3 text-right font-medium text-slate-700">
                              {formatNumber(row.summary.totalWorkHours)} hrs
                            </td>
                            {/* Status */}
                            <td className="px-4 py-3">
                              <span
                                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                                  row.summary.partialItems === 0
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {completeness(row)}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td colSpan={4} className="px-4 py-3 text-right text-slate-400 text-xs italic">
                              {row.state === 'error' ? 'Unavailable' : 'Measuring…'}
                            </td>
                            <td />
                          </>
                        )}

                        {/* Chevron Action */}
                        <td className="px-4 py-3 text-center">
                          <Link
                            href={detailHref}
                            className="inline-flex p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          >
                            <ChevronRight className="w-5 h-5" />
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
