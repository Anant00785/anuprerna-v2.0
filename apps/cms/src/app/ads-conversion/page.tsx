'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeading } from '@/components/ui/PageHeading';
import {
  AdsConversionService,
  AdsConversionSummary,
  AttributedOrder,
  AbandonedAdCart,
} from '@/services/ads-conversion-service';
import { Filter, Download, HelpCircle, Calendar, RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';

type DetailTab = 'orders' | 'carts';

export default function AdsConversionPage() {
  const [fromDate, setFromDate] = useState<string>(
    dayjs().subtract(30, 'day').format('YYYY-MM-DD')
  );
  const [toDate, setToDate] = useState<string>(dayjs().format('YYYY-MM-DD'));

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
            ['Order', 'Date', 'Campaign', 'Source', 'Click type', 'Value', 'Currency'],
            ...orders.map((o) => [
              String(o.orderId),
              new Date(o.createdAt).toISOString(),
              o.campaign || '',
              o.source || '',
              o.clickIdType || '',
              String(o.total),
              o.currency || 'INR',
            ]),
          ]
        : [
            ['Customer', 'Email', 'Campaign', 'Source', 'Click type', 'Captured', 'Items'],
            ...carts.map((c) => [
              c.customerName || '',
              c.customerEmail || '',
              c.campaign || '',
              c.source || '',
              c.clickIdType || '',
              new Date(c.capturedAt).toISOString(),
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
    <div className="space-y-6 pb-12">
      <PageHeading heading="ADS CONVERSION" />

      {/* Date Range Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 uppercase">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 uppercase">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#46496E] hover:bg-[#363857] rounded-lg shadow-2xs flex items-center gap-2 transition disabled:opacity-50"
          >
            <Filter className="w-4 h-4" />
            <span>Apply</span>
          </button>
        </div>

        <button
          onClick={exportCsv}
          className="w-full md:w-auto px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs flex items-center justify-center gap-2 transition"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Hero Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attributed orders */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Attributed orders</div>
          <div className="text-3xl font-extrabold text-slate-900">
            {summary?.attributedOrdersCount || 0}
          </div>
          <div className="text-xs text-slate-400">Paid orders traced to an ad click</div>
        </div>

        {/* Attributed revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Attributed revenue</div>
          <div className="text-3xl font-extrabold text-slate-900">
            ₹{(summary?.attributedRevenue || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400">Order value from ad-driven orders</div>
        </div>

        {/* Top campaign */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Top campaign</div>
          <div className="text-2xl font-extrabold text-slate-900 truncate">
            {topCampaign?.campaign || '—'}
          </div>
          <div className="text-xs text-slate-400">
            {topCampaign ? `${topCampaign.orderCount} orders · ₹${topCampaign.revenue.toLocaleString('en-IN')}` : 'No campaign data'}
          </div>
        </div>

        {/* Abandoned ad carts */}
        <div className="bg-amber-50/70 p-5 rounded-xl border border-amber-200 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-amber-800">Abandoned ad carts</div>
          <div className="text-3xl font-extrabold text-amber-900">
            {summary?.abandonedAdCartsCount || 0}
          </div>
          <div className="text-xs text-amber-700">
            Ad-driven carts not yet ordered — a remarketing list
          </div>
        </div>
      </div>

      {/* Campaigns by orders bar charts */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
        <div>
          <h3 className="font-bold text-slate-800 text-base">Campaigns by orders</h3>
          <p className="text-xs text-slate-500">Which ad campaigns drove the most orders in this window.</p>
        </div>

        <div className="space-y-4">
          {(summary?.campaigns || []).map((stat) => {
            const max = Math.max(1, ...(summary?.campaigns || []).map((c) => c.orderCount));
            const widthPct = Math.round((stat.orderCount / max) * 100);
            return (
              <div key={stat.campaign} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-bold">{stat.campaign}</span>
                    <span className="text-slate-400 font-normal">{stat.source}</span>
                  </div>
                  <span className="text-slate-700">
                    {stat.orderCount} · ₹{stat.revenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#565985] h-full rounded-full transition-all duration-300"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Tables */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
        <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'orders'
                ? 'border-[#46496E] text-[#46496E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Attributed orders
          </button>
          <button
            onClick={() => setActiveTab('carts')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'carts'
                ? 'border-[#46496E] text-[#46496E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Abandoned ad carts
          </button>
        </div>

        {activeTab === 'orders' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Click Type</th>
                  <th className="px-4 py-3 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-bold text-slate-800">#{o.orderId}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {dayjs(o.createdAt).format('MMM D, YYYY, h:mm:ss A')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{o.campaign || 'Unattributed'}</td>
                    <td className="px-4 py-3 text-slate-500">{o.source || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {o.clickIdType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {o.total.toLocaleString('en-IN')} {o.currency || 'INR'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Click Type</th>
                  <th className="px-4 py-3">Captured</th>
                  <th className="px-4 py-3 text-right">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {carts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-bold text-slate-800">{c.customerName || 'Guest'}</td>
                    <td className="px-4 py-3 text-slate-600">{c.customerEmail || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{c.campaign || 'Unattributed'}</td>
                    <td className="px-4 py-3 text-slate-500">{c.source || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {c.clickIdType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {dayjs(c.capturedAt).format('MMM D, YYYY, h:mm A')}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{c.itemCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Guide Cards */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          <span>Understanding click types</span>
        </div>
        <p className="text-xs text-slate-500">
          The identifier a visit carries tells you the device and path the shopper came through. Organic (non-ad) visits carry none, and privacy browsers may strip the id while keeping the UTM tags.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* GCLID */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">GCLID</span>
              <span className="text-[10px] text-slate-500">Desktop & mobile web</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              <strong>Google Click Identifier.</strong> The standard tag added when a shopper clicks a Google ad in a browser.
            </p>
          </div>

          {/* GBRAID */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">GBRAID</span>
              <span className="text-[10px] text-slate-500">Web ad → iOS app</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              <strong>Web-to-app on iOS.</strong> Set when the click begins on web but journey continues into an iOS app under Apple App Tracking Transparency.
            </p>
          </div>

          {/* WBRAID */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">WBRAID</span>
              <span className="text-[10px] text-slate-500">iOS app ad → web</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              <strong>App-to-web on iOS.</strong> Set when a shopper taps an ad inside an iOS app and lands on the website.
            </p>
          </div>

          {/* UTM only */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">UTM only</span>
              <span className="text-[10px] text-slate-500">Privacy browsers</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              <strong>No click id, tags intact.</strong> Brave, Safari privacy prevention strip click ids but leave utm_tags.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
