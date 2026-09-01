'use client';

/**
 * ImpactClient — client component for the Impact Factor page.
 *
 * Two tabs (Regular / Custom orders), a status filter for regular orders, a hero
 * strip of rolled-up environmental + artisan-hour metrics, and a per-order table.
 *
 * Data arrives in ONE request from /api/impact/batch (server-side fan-out), so
 * there is no client N+1. Totals are computed once the batch resolves. A
 * generation counter guards against stale batches when the tab/status switches.
 *
 * The "Trigger recompute" button from the live Angular admin is rendered VISIBLY
 * DISABLED — no POST calls are ever made from this page (read-only proxy).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Leaf, Droplets, Wind, Clock, Users } from 'lucide-react';
import { WeaveShell } from '@/components/weave/WeaveShell';
import { TabBar } from '@/components/ui/TabBar';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import {
  fetchImpactBatch,
  type ImpactOrderRow,
  type ImpactSummary,
  type ImpactTotals,
} from '@/lib/impact-api';

// -- Types ---------------------------------------------------------------------

type TabType = 'regular' | 'custom';
type OrderStatus =
  | 'PROCESSING'
  | 'PARTIALLY_DISPATCHED'
  | 'IN_TRANSIT'
  | 'DISPATCHED'
  | 'DELIVERED';

interface ImpactRow {
  order: ImpactOrderRow;
  summary: ImpactSummary | null;
}

// -- Constants -----------------------------------------------------------------

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'PARTIALLY_DISPATCHED', label: 'Partially Dispatched' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'DELIVERED', label: 'Delivered' },
];

// -- Helpers -------------------------------------------------------------------

function emptyTotals(): ImpactTotals {
  return {
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
  };
}

function fmt(n: number | null | undefined, decimals = 0): string {
  return (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: decimals });
}

function completeness(row: ImpactRow): string {
  if (!row.summary) return '—';
  const total = row.summary.completeItems + row.summary.partialItems;
  if (total === 0) return 'No items';
  if (row.summary.partialItems === 0) return 'Complete';
  return row.summary.completeItems + '/' + total + ' complete';
}

function formatStatus(s: string): string {
  return s
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

// -- Metric tile ---------------------------------------------------------------

interface MetricTileProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

function MetricTile({ label, value, icon }: MetricTileProps) {
  return (
    <div className="rounded-xl border bg-white p-4" style={{ borderColor: '#E8E4DE' }}>
      {icon && (
        <div
          className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: '#FEF3E2', color: '#A86120' }}
        >
          {icon}
        </div>
      )}
      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#847D77' }}>
        {label}
      </p>
      <p className="mt-1 font-serif text-xl font-semibold" style={{ color: '#1A1714' }}>
        {value}
      </p>
    </div>
  );
}

// -- Main component ------------------------------------------------------------

export function ImpactClient() {
  const [tab, setTab] = useState<TabType>('regular');
  const [status, setStatus] = useState<OrderStatus>('PROCESSING');
  const [rows, setRows] = useState<ImpactRow[]>([]);
  const [totals, setTotals] = useState<ImpactTotals>(emptyTotals());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Generation counter guards against a stale batch resolving after a newer load.
  const genRef = useRef(0);

  const load = useCallback(
    async (currentTab: TabType, currentStatus: OrderStatus) => {
      const gen = ++genRef.current;
      setLoading(true);
      setError(null);
      setRows([]);
      setTotals(emptyTotals());

      const res = await fetchImpactBatch(currentTab, currentStatus, 20);
      if (gen !== genRef.current) return;

      if (!res.ok) {
        setError(res.error);
        setLoading(false);
        return;
      }

      const acc = emptyTotals();
      const nextRows: ImpactRow[] = res.data.map((o) => {
        const summary = o.summary;
        if (summary) {
          acc.orderCount += 1;
          acc.completeItems += summary.completeItems;
          acc.partialItems += summary.partialItems;
          acc.fabricMeters += summary.fabricMeters;
          acc.co2OffsetKg += summary.co2OffsetKg;
          acc.waterSavedLitres += summary.waterSavedLitres;
          acc.artisanHours += summary.artisanHours;
          acc.womenArtisanHours += summary.womenArtisanHours;
          acc.stitchingHours += summary.stitchingHours;
          acc.womenStitchingHours += summary.womenStitchingHours;
          acc.totalWorkHours += summary.totalWorkHours;
        }
        return {
          order: {
            id: o.id,
            name: o.name,
            orderStatus: o.orderStatus,
            createdAt: o.createdAt,
            custom: o.custom,
          },
          summary,
        };
      });

      setTotals(acc);
      setRows(nextRows);
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    void load(tab, status);
  }, [tab, status, load]);

  const scopeLabel =
    tab === 'custom'
      ? 'custom orders'
      : formatStatus(status).toLowerCase() + ' orders';
  const contextLabel =
    rows.length > 0 ? 'Across ' + rows.length + ' most recent ' + scopeLabel : '';

  const typeTabs = [
    { id: 'regular', label: 'Regular Orders' },
    { id: 'custom', label: 'Custom Orders' },
  ];

  return (
    <WeaveShell
      breadcrumb={
        <span className="text-sm" style={{ color: '#635D58' }}>
          Impact Factor
        </span>
      }
    >
      <div className="mx-auto max-w-screen-xl px-6 py-8 space-y-8">

        {/* -- Header -- */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#847D77' }}>
            Operations
          </p>
          <h1 className="font-serif text-3xl font-semibold" style={{ color: '#1A1714' }}>
            Impact Factor
          </h1>
          <p className="mt-2 text-sm max-w-2xl" style={{ color: '#635D58' }}>
            Environmental savings and artisan work-hours, rolled up from per-order impact data.
            Switch tab or status to change the sample.
          </p>
        </div>

        {/* -- Hero strip -- */}
        <section
          className="rounded-xl border p-6 space-y-5"
          style={{ borderColor: '#E8E4DE', background: '#FDFCFA' }}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: '#FEF3E2', color: '#A86120' }}
              >
                <Leaf className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium" style={{ color: '#4A4540' }}>
                {loading ? 'Loading…' : contextLabel || 'No impact data'}
              </p>
            </div>
            {totals.orderCount > 0 && (
              <p className="text-xs" style={{ color: '#AAA39E' }}>
                {totals.orderCount} orders with impact data
              </p>
            )}
          </div>

          {/* Environmental row */}
          <div>
            <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: '#AAA39E' }}>
              Environmental
            </p>
            <div className="grid grid-cols-3 gap-3">
              <MetricTile label="Fabric Consumed" value={fmt(totals.fabricMeters, 1) + ' m'} icon={<Leaf className="h-3.5 w-3.5" />} />
              <MetricTile label="CO₂ Offset" value={fmt(totals.co2OffsetKg, 2) + ' kg'} icon={<Wind className="h-3.5 w-3.5" />} />
              <MetricTile label="Water Saved" value={fmt(totals.waterSavedLitres) + ' L'} icon={<Droplets className="h-3.5 w-3.5" />} />
            </div>
          </div>

          {/* Artisan hours row */}
          <div>
            <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: '#AAA39E' }}>
              Artisan Work Hours
            </p>
            <div className="grid grid-cols-5 gap-3">
              <MetricTile label="Total Hours" value={fmt(totals.totalWorkHours, 1)} icon={<Clock className="h-3.5 w-3.5" />} />
              <MetricTile label="Artisan Hrs" value={fmt(totals.artisanHours, 1)} icon={<Users className="h-3.5 w-3.5" />} />
              <MetricTile label="Women Artisan" value={fmt(totals.womenArtisanHours, 1)} />
              <MetricTile label="Stitching Hrs" value={fmt(totals.stitchingHours, 1)} />
              <MetricTile label="Women Stitching" value={fmt(totals.womenStitchingHours, 1)} />
            </div>
          </div>
        </section>

        {/* -- Tab + filter controls -- */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabBar
            tabs={typeTabs}
            active={tab}
            onChange={(id) => setTab(id as TabType)}
            variant="pill"
            pillStyle="solid"
            ariaLabel="Order type"
          />

          {tab === 'regular' && (
            <div className="flex items-center gap-2 text-sm" style={{ color: '#635D58' }}>
              <span>Showing</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="rounded-lg border px-3 py-1.5 text-sm focus:outline-none"
                style={{ borderColor: '#E8E4DE', color: '#1A1714', background: 'white' }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* -- Error / order table -- */}
        {error && <ErrorBanner message={error} />}

        {!error && loading && (
          <div className="py-16 text-center text-sm" style={{ color: '#AAA39E' }}>
            Loading orders…
          </div>
        )}

        {!error && !loading && rows.length === 0 && (
          <div className="py-16 text-center text-sm" style={{ color: '#AAA39E' }}>
            No orders found for this view.
          </div>
        )}

        {!error && rows.length > 0 && (
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: '#E8E4DE' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: '#E8E4DE', background: '#FDFCFA' }}>
                  {['Order', 'Customer', 'Cloth', 'Carbon', 'Water', 'Handwork', 'Coverage', 'Status', 'Details'].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={
                          'px-4 py-3 text-xs font-medium uppercase tracking-wider ' +
                          (i >= 2 && i <= 5 ? 'text-right' : 'text-left')
                        }
                        style={{ color: '#847D77' }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.order.id}
                    className="border-b last:border-0 transition-colors hover:bg-stone-50"
                    style={{ borderColor: '#E8E4DE' }}
                  >
                    <td className="px-4 py-3 font-mono text-sm font-medium" style={{ color: '#1A1714' }}>
                      #{row.order.id}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#4A4540' }}>
                      {row.order.name || '—'}
                    </td>

                    {row.summary ? (
                      <>
                        <td className="px-4 py-3 text-right font-mono" style={{ color: '#1A1714' }}>
                          {fmt(row.summary.fabricMeters, 1)} m
                        </td>
                        <td className="px-4 py-3 text-right font-mono" style={{ color: '#1A1714' }}>
                          {fmt(row.summary.co2OffsetKg, 2)} kg
                        </td>
                        <td className="px-4 py-3 text-right font-mono" style={{ color: '#1A1714' }}>
                          {fmt(row.summary.waterSavedLitres)} L
                        </td>
                        <td className="px-4 py-3 text-right font-mono" style={{ color: '#1A1714' }}>
                          {fmt(row.summary.totalWorkHours, 1)} hrs
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ' +
                              (row.summary.partialItems === 0
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700')
                            }
                          >
                            {completeness(row)}
                          </span>
                        </td>
                      </>
                    ) : (
                      <td colSpan={5} className="px-4 py-3 text-xs" style={{ color: '#AAA39E' }}>
                        Not yet computed
                      </td>
                    )}

                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-stone-100"
                        style={{ color: '#635D58' }}
                      >
                        {formatStatus(row.order.orderStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={'/impact/' + row.order.id}
                        className="text-xs font-medium hover:underline"
                        style={{ color: '#A86120' }}
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* -- Trigger note (read-only in sandbox) -- */}
        <div
          className="flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-xs"
          style={{ borderColor: '#E8E4DE', color: '#AAA39E', background: '#FDFCFA' }}
        >
          <span>Impact recomputation is available in the live admin.</span>
          <button
            type="button"
            disabled
            title="Read-only in sandbox — trigger not available"
            className="rounded px-3 py-1 text-xs font-medium cursor-not-allowed opacity-40"
            style={{ background: '#E8E4DE', color: '#635D58' }}
          >
            Trigger recompute
          </button>
          <span style={{ color: '#C7C1BB' }}>Disabled in sandbox (read-only proxy).</span>
        </div>

      </div>
    </WeaveShell>
  );
}
