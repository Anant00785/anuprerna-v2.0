'use client';

/**
 * ImpactDetailView — per-order impact drill-down (client component).
 *
 * Renders:
 *  1. Order-level summary card (8 metric tiles + completeness counts) — matches
 *     the live Angular metricCards getter in order-impact-dashboard.component.ts.
 *  2. Per-item table with exactly 15 columns — mirrors
 *     order-impact-dashboard.component.html lines 71-91.
 *
 * Read-only: no writes. The "Recalculate" button from the live admin is rendered
 * visibly disabled with a ReadOnlyBadge.
 */

import React from 'react';
import Link from 'next/link';
import { WeaveShell } from '@/components/weave/WeaveShell';
import type { ImpactDetail, ImpactItem } from '@/lib/impact-api';

// -- Palette -------------------------------------------------------------------
// active #A86120 | inactive #847D77 | borders #E8E4DE | soft #FEF3E2

// -- ReadOnlyBadge (inline — NOT exported to src/components/ui/) ---------------
function ReadOnlyBadge() {
  return (
    <span
      title="Read-only in sandbox — mutations are not available"
      className="rounded px-2 py-1 text-xs font-medium cursor-not-allowed opacity-50 select-none"
      style={{ background: '#F3F1ED', color: '#847D77', border: '1px solid #E8E4DE' }}
    >
      Read-only
    </span>
  );
}

// -- Helpers -------------------------------------------------------------------

/**
 * Format a nullable numeric metric. Mirrors the live Angular formatMetric():
 *   null/undefined → 'N/A'
 *   number → locale-formatted + unit suffix
 */
function fmt(value: number | null | undefined, unit = ''): string {
  if (value === null || typeof value === 'undefined') return 'N/A';
  const formatted = value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Convert a pendingReason string to human-readable form.
 * Mirrors live Angular formatPendingReason():
 *   'WORKFLOW_NOT_CONFIGURED,SUB_CATEGORY_AVG_WORK_HOURS_PER_METER_NOT_CONFIGURED'
 *   → 'workflow not configured, sub category avg work hours per meter not configured'
 */
function formatPendingReason(reason: string | null | undefined): string {
  if (!reason) return '';
  return reason
    .split(',')
    .map((v) => v.replace(/_/g, ' ').toLowerCase())
    .join(', ');
}

/** Format a unix-ms timestamp → dd-MM-yyyy h:mm a (mirrors Angular DatePipe 'dd-MM-yyyy h:mm a') */
function formatDate(ms: number): string {
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  let h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${dd}-${mm}-${yyyy} ${h}:${min} ${ampm}`;
}

// -- Sub-components ------------------------------------------------------------

interface MetricTileProps {
  label: string;
  value: string;
}

function MetricTile({ label, value }: MetricTileProps) {
  return (
    <div className="rounded-xl border bg-white p-4" style={{ borderColor: '#E8E4DE' }}>
      <p
        className="text-xs font-medium uppercase tracking-wider"
        style={{ color: '#847D77' }}
      >
        {label}
      </p>
      <p className="mt-1 font-serif text-xl font-semibold" style={{ color: '#1A1714' }}>
        {value}
      </p>
    </div>
  );
}

// -- Status badge for calculationStatus ----------------------------------------
// Enum values from live-weave-ref/.../interface/impact-item.ts line 3-4:
//   calculationStatus: 'PARTIAL' | 'COMPLETE' | string

function StatusBadge({ status }: { status: string }) {
  const isComplete = status === 'COMPLETE';
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={
        isComplete
          ? { background: '#ECFDF5', color: '#065F46' }
          : { background: '#FFFBEB', color: '#92400E' }
      }
    >
      {status}
    </span>
  );
}

// -- Per-item table ------------------------------------------------------------
// 15 columns matching live order-impact-dashboard.component.html lines 71-91:
//  1 Workflow | 2 Order Item | 3 Type | 4 Status | 5 Pending Reason |
//  6 Fabric | 7 CO2 | 8 Water | 9 Artisan | 10 Women Artisan |
//  11 Stitching | 12 Women Stitching | 13 Total | 14 Version | 15 Updated

const COLUMNS = [
  'Workflow',
  'Order Item',
  'Type',
  'Status',
  'Pending Reason',
  'Fabric',
  'CO2',
  'Water',
  'Artisan',
  'Women Artisan',
  'Stitching',
  'Women Stitching',
  'Total',
  'Version',
  'Updated',
] as const;

function ItemRow({ item }: { item: ImpactItem }) {
  return (
    <tr
      className="border-b last:border-0 hover:bg-stone-50 transition-colors"
      style={{ borderColor: '#E8E4DE' }}
    >
      {/* 1 Workflow — mirrors line 71 */}
      <td className="px-3 py-3 font-mono text-xs" style={{ color: '#635D58' }}>
        {item.workflowId != null ? `#${item.workflowId}` : 'Pending'}
      </td>
      {/* 2 Order Item — mirrors line 72 */}
      <td className="px-3 py-3 font-mono text-xs font-medium" style={{ color: '#1A1714' }}>
        #{item.orderItemId}
      </td>
      {/* 3 Type — mirrors line 73-75 */}
      <td className="px-3 py-3">
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ background: '#F3F1ED', color: '#847D77' }}
        >
          {item.productType}
        </span>
      </td>
      {/* 4 Status — mirrors line 76-80; enum: 'COMPLETE' | 'PARTIAL' (impact-item.ts:3) */}
      <td className="px-3 py-3">
        <StatusBadge status={item.calculationStatus} />
      </td>
      {/* 5 Pending Reason — mirrors line 81 */}
      <td className="px-3 py-3 text-xs max-w-[180px] truncate" style={{ color: '#847D77' }}>
        {formatPendingReason(item.pendingReason) || '—'}
      </td>
      {/* 6 Fabric — mirrors line 82 */}
      <td className="px-3 py-3 text-right font-mono text-xs" style={{ color: '#1A1714' }}>
        {fmt(item.fabricMeters, 'm')}
      </td>
      {/* 7 CO2 — mirrors line 83 */}
      <td className="px-3 py-3 text-right font-mono text-xs" style={{ color: '#1A1714' }}>
        {fmt(item.co2OffsetKg, 'kg')}
      </td>
      {/* 8 Water — mirrors line 84 */}
      <td className="px-3 py-3 text-right font-mono text-xs" style={{ color: '#1A1714' }}>
        {fmt(item.waterSavedLitres, 'L')}
      </td>
      {/* 9 Artisan — mirrors line 85 */}
      <td className="px-3 py-3 text-right font-mono text-xs" style={{ color: '#1A1714' }}>
        {fmt(item.artisanHours, 'hrs')}
      </td>
      {/* 10 Women Artisan — mirrors line 86 */}
      <td className="px-3 py-3 text-right font-mono text-xs" style={{ color: '#1A1714' }}>
        {fmt(item.womenArtisanHours, 'hrs')}
      </td>
      {/* 11 Stitching — mirrors line 87 */}
      <td className="px-3 py-3 text-right font-mono text-xs" style={{ color: '#1A1714' }}>
        {fmt(item.stitchingHours, 'hrs')}
      </td>
      {/* 12 Women Stitching — mirrors line 88 */}
      <td className="px-3 py-3 text-right font-mono text-xs" style={{ color: '#1A1714' }}>
        {fmt(item.womenStitchingHours, 'hrs')}
      </td>
      {/* 13 Total — mirrors line 89 */}
      <td className="px-3 py-3 text-right font-mono text-xs font-semibold" style={{ color: '#A86120' }}>
        {fmt(item.totalWorkHours, 'hrs')}
      </td>
      {/* 14 Version — mirrors line 90: 'v' + item.assumptionVersion */}
      <td className="px-3 py-3 text-xs" style={{ color: '#847D77' }}>
        v{item.assumptionVersion}
      </td>
      {/* 15 Updated — mirrors line 91: date:'dd-MM-yyyy h:mm a' */}
      <td className="px-3 py-3 text-xs whitespace-nowrap" style={{ color: '#847D77' }}>
        {formatDate(item.updatedAt)}
      </td>
    </tr>
  );
}

// -- Main component ------------------------------------------------------------

interface ImpactDetailViewProps {
  impact: ImpactDetail;
  id: string;
}

export function ImpactDetailView({ impact, id }: ImpactDetailViewProps) {
  const isZeroImpact =
    !impact.items.length &&
    impact.fabricMeters === 0 &&
    impact.co2OffsetKg === 0 &&
    impact.waterSavedLitres === 0 &&
    impact.artisanHours === 0 &&
    impact.womenArtisanHours === 0 &&
    impact.stitchingHours === 0 &&
    impact.womenStitchingHours === 0 &&
    impact.totalWorkHours === 0;

  return (
    <WeaveShell
      breadcrumb={
        <div className="flex items-center gap-2 text-sm" style={{ color: '#847D77' }}>
          <Link href="/impact" style={{ color: '#847D77' }} className="hover:underline">
            Impact Factor
          </Link>
          <span>/</span>
          <span className="font-medium" style={{ color: '#1A1714' }}>
            Order #{id}
          </span>
        </div>
      }
    >
      <div className="mx-auto max-w-screen-xl px-6 py-8 space-y-8">

        {/* -- Header -- */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p
              className="text-xs font-medium uppercase tracking-wider mb-1"
              style={{ color: '#847D77' }}
            >
              Operations · Impact Factor
            </p>
            <h1
              className="font-serif text-3xl font-semibold"
              style={{ color: '#1A1714' }}
            >
              Order #{id} Impact
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#635D58' }}>
              {impact.completeItems} complete item{impact.completeItems !== 1 ? 's' : ''},&nbsp;
              {impact.partialItems} pending
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <ReadOnlyBadge />
            {/* Recalculate trigger is a write action — disabled in sandbox */}
            <button
              type="button"
              disabled
              title="Read-only in sandbox — trigger not available"
              className="rounded-lg px-3 py-2 text-xs font-medium cursor-not-allowed opacity-40 border"
              style={{ background: '#E8E4DE', color: '#635D58', borderColor: '#D5CFC8' }}
            >
              Recalculate impact
            </button>
          </div>
        </div>

        {/* -- Order-level summary card -- */}
        {/* Mirrors metricCards getter from order-impact-dashboard.component.ts */}
        <section
          className="rounded-xl border p-6 space-y-5"
          style={{ borderColor: '#E8E4DE', background: '#FDFCFA' }}
        >
          <div>
            <p
              className="text-xs font-medium mb-3 uppercase tracking-wider"
              style={{ color: '#AAA39E' }}
            >
              Environmental
            </p>
            <div className="grid grid-cols-3 gap-3">
              <MetricTile label="Fabric meters" value={fmt(impact.fabricMeters, 'm')} />
              <MetricTile label="CO₂ offset" value={fmt(impact.co2OffsetKg, 'kg')} />
              <MetricTile label="Water saved" value={fmt(impact.waterSavedLitres, 'L')} />
            </div>
          </div>
          <div>
            <p
              className="text-xs font-medium mb-3 uppercase tracking-wider"
              style={{ color: '#AAA39E' }}
            >
              Artisan Work Hours
            </p>
            <div className="grid grid-cols-5 gap-3">
              <MetricTile label="Total work hours" value={fmt(impact.totalWorkHours, 'hrs')} />
              <MetricTile label="Artisan hours" value={fmt(impact.artisanHours, 'hrs')} />
              <MetricTile label="Women artisan" value={fmt(impact.womenArtisanHours, 'hrs')} />
              <MetricTile label="Stitching hours" value={fmt(impact.stitchingHours, 'hrs')} />
              <MetricTile label="Women stitching" value={fmt(impact.womenStitchingHours, 'hrs')} />
            </div>
          </div>
          <div>
            <p
              className="text-xs font-medium mb-3 uppercase tracking-wider"
              style={{ color: '#AAA39E' }}
            >
              Completeness
            </p>
            <div className="grid grid-cols-2 gap-3">
              <MetricTile
                label="Complete items"
                value={String(impact.completeItems)}
              />
              <MetricTile
                label="Partial items"
                value={String(impact.partialItems)}
              />
            </div>
          </div>
        </section>

        {/* -- Zero-impact notice -- */}
        {isZeroImpact && (
          <div
            className="rounded-xl border px-5 py-8 text-center text-sm"
            style={{ borderColor: '#E8E4DE', color: '#AAA39E', background: '#FDFCFA' }}
          >
            No impact has been computed for this order yet.
          </div>
        )}

        {/* -- Per-item table -- */}
        {/* 15 columns mirroring order-impact-dashboard.component.html:71-91 */}
        {impact.items.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: '#1A1714' }}>
                  Order item impact
                </p>
                <p className="text-xs" style={{ color: '#847D77' }}>
                  {impact.completeItems} complete, {impact.partialItems} pending
                </p>
              </div>
            </div>
            <div
              className="rounded-xl border overflow-x-auto"
              style={{ borderColor: '#E8E4DE' }}
            >
              <table className="w-full text-sm" style={{ minWidth: '1100px' }}>
                <thead>
                  <tr
                    className="border-b"
                    style={{ borderColor: '#E8E4DE', background: '#FAF9F7' }}
                  >
                    {COLUMNS.map((col, i) => (
                      <th
                        key={col}
                        className={
                          'px-3 py-3 text-[11px] font-semibold uppercase tracking-wider ' +
                          (i >= 5 && i <= 12 ? 'text-right' : 'text-left')
                        }
                        style={{ color: '#847D77' }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {impact.items.map((item) => (
                    <ItemRow key={item.orderItemId} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* -- Back link -- */}
        <div>
          <Link
            href="/impact"
            className="text-sm hover:underline"
            style={{ color: '#847D77' }}
          >
            ← Back to Impact Factor
          </Link>
        </div>

      </div>
    </WeaveShell>
  );
}
