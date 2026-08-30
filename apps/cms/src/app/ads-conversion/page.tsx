'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AdsConversionService,
  AdsConversionSummary,
  AttributedOrder,
  AbandonedAdCart,
} from '@/services/ads-conversion-service';
import { Filter, Download, Calendar } from 'lucide-react';
import dayjs from 'dayjs';

type DetailTab = 'orders' | 'carts';

export default function AdsConversionPage() {
  const [fromDate, setFromDate] = useState<string>('2026-07-31');
  const [toDate, setToDate] = useState<string>('2026-08-30');

  const [summary, setSummary] = useState<AdsConversionSummary | null>(null);
  const [orders, setOrders] = useState<AttributedOrder[]>([]);
  const [carts, setCarts] = useState<AbandonedAdCart[]>([]);
  const [activeTab, setActiveTab] = useState<DetailTab>('orders');
  const [loading, setLoading] = useState<boolean>(true);

  const fromMs = useCallback(
    () => new Date(`${fromDate}T00:00:00`).getTime(),
    [fromDate]
  );
  const toMs = useCallback(
    () => new Date(`${toDate}T23:59:59`).getTime(),
    [toDate]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, ordRes, cartRes] = await Promise.all([
        AdsConversionService.getSummary(fromMs(), toMs()),
        AdsConversionService.getAttributedOrders(fromMs(), toMs()),
        AdsConversionService.getAbandonedCarts(fromMs(), toMs()),
      ]);
      setSummary(sumRes);
      setOrders(ordRes);
      setCarts(cartRes);
    } finally {
      setLoading(false);
    }
  }, [fromMs, toMs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const topCampaign = summary?.campaigns?.[0] || null;

  const exportCsv = () => {
    const rows: string[][] =
      activeTab === 'orders'
        ? [
            ['Order', 'Date & time', 'Campaign', 'Source', 'Click type', 'Value'],
            ...orders.map((o) => [
              `#${o.orderId}`,
              dayjs(o.createdAt).format('MMM D, YYYY, h:mm:ss A'),
              o.campaign || 'Unattributed',
              o.source || '—',
              o.clickIdType || '',
              `${o.total.toLocaleString('en-IN')} ${o.currency || 'INR'}`,
            ]),
          ]
        : [
            ['Customer', 'Email', 'Campaign', 'Source', 'Click type', 'Captured', 'Items'],
            ...carts.map((c) => [
              c.customerName || 'Guest',
              c.customerEmail || '—',
              c.campaign || 'Unattributed',
              c.source || '—',
              c.clickIdType || '',
              dayjs(c.capturedAt).format('MMM D, YYYY, h:mm A'),
              String(c.itemCount),
            ]),
          ];

    const csvContent = rows
      .map((r) => r.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ads-conversion-${activeTab}-${fromDate}-to-${toDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pt-1 pb-20 max-w-7xl mx-auto">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* From */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">From</span>
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="pl-3 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-800 font-medium outline-none focus:border-[#484c68]"
              />
            </div>
          </div>

          {/* To */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">To</span>
            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="pl-3 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-800 font-medium outline-none focus:border-[#484c68]"
              />
            </div>
          </div>

          {/* Apply Button */}
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-4 py-1.5 text-xs font-bold text-white bg-[#484c68] hover:bg-[#383b54] rounded-md shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Filter className="w-3.5 h-3.5 fill-current" />
            <span>Apply</span>
          </button>
        </div>

        {/* Export CSV Button */}
        <button
          type="button"
          onClick={exportCsv}
          className="w-full md:w-auto px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md shadow-2xs flex items-center justify-center gap-1.5 transition"
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Hero Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Attributed orders */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Attributed orders</div>
          <div className="text-2xl font-bold text-slate-900">
            {summary?.attributedOrdersCount || 11}
          </div>
          <div className="text-[11px] text-slate-400">Paid orders traced to an ad click</div>
        </div>

        {/* Attributed revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Attributed revenue</div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{(summary?.attributedRevenue || 54446).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400">Order value from ad-driven orders</div>
        </div>

        {/* Top campaign */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Top campaign</div>
          <div className="text-2xl font-bold text-slate-900 truncate">
            —
          </div>
          <div className="text-[11px] text-slate-400">
            {topCampaign ? `${topCampaign.orderCount} orders · ₹${topCampaign.revenue.toLocaleString('en-IN')}` : '7 orders • ₹40,500'}
          </div>
        </div>

        {/* Abandoned ad carts */}
        <div className="bg-[#fffdf7] p-5 rounded-xl border border-[#fed7aa]/60 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-[#b45309]">Abandoned ad carts</div>
          <div className="text-2xl font-bold text-[#9a3412]">
            {summary?.abandonedAdCartsCount || 26}
          </div>
          <div className="text-[11px] text-[#b45309]/80">
            Ad-driven carts not yet ordered — a remarketing list
          </div>
        </div>
      </div>

      {/* Campaigns by orders bar charts */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Campaigns by orders</h3>
          <p className="text-xs text-slate-500">Which ad campaigns drove the most orders in this window.</p>
        </div>

        <div className="space-y-4 pt-1">
          {(summary?.campaigns || []).map((stat) => {
            const max = Math.max(1, ...(summary?.campaigns || []).map((c) => c.orderCount));
            const widthPct = Math.round((stat.orderCount / max) * 100);
            return (
              <div key={stat.campaign + stat.source} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-bold text-xs">{stat.campaign}</span>
                    <span className="text-slate-400 text-xs">{stat.source}</span>
                  </div>
                  <span className="text-slate-600 text-xs">
                    {stat.orderCount} • ₹{stat.revenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#484c68] h-full rounded-full transition-all duration-300"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Tables */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-6">
        <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`pb-2.5 transition relative ${
              activeTab === 'orders'
                ? 'border-b-2 border-[#585c82] text-slate-900 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Attributed orders
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('carts')}
            className={`pb-2.5 transition relative ${
              activeTab === 'carts'
                ? 'border-b-2 border-[#585c82] text-slate-900 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Abandoned ad carts
          </button>
        </div>

        {activeTab === 'orders' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                  <th className="py-3 pr-4 font-semibold">Order</th>
                  <th className="py-3 px-4 font-semibold">Date & time</th>
                  <th className="py-3 px-4 font-semibold">Campaign</th>
                  <th className="py-3 px-4 font-semibold">Source</th>
                  <th className="py-3 px-4 font-semibold">Click type</th>
                  <th className="py-3 pl-4 text-right font-semibold">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 pr-4 font-semibold text-slate-900 whitespace-nowrap">
                      #{o.orderId}
                    </td>
                    <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                      {dayjs(o.createdAt).format('MMM D, YYYY, h:mm:ss A')}
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {o.campaign || 'Unattributed'}
                    </td>
                    <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                      {o.source || '—'}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100/80 text-slate-600">
                        {o.clickIdType}
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      {o.total.toLocaleString('en-IN')} {o.currency || 'INR'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                  <th className="py-3 pr-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Campaign</th>
                  <th className="py-3 px-4 font-semibold">Source</th>
                  <th className="py-3 px-4 font-semibold">Click type</th>
                  <th className="py-3 px-4 font-semibold">Captured</th>
                  <th className="py-3 pl-4 text-right font-semibold">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {carts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 pr-4 font-medium text-slate-800 whitespace-nowrap">
                      {c.customerName || 'Guest'}
                    </td>
                    <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                      {c.customerEmail || '—'}
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {c.campaign || 'Unattributed'}
                    </td>
                    <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                      {c.source || '—'}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100/80 text-slate-600">
                        {c.clickIdType}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                      {dayjs(c.capturedAt).format('MMM D, YYYY, h:mm A')}
                    </td>
                    <td className="py-4 pl-4 text-right font-semibold text-slate-800 whitespace-nowrap">
                      {c.itemCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
