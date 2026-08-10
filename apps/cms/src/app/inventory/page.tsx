'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import { Warehouse, ClipboardList, Scale, Bell, Plus, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { InventoryService } from '@/services/inventory-service';

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    warehouses: 0,
    reasons: 0,
    adjustments: 0,
    restockRequests: 0,
    pendingRestocks: 0,
  });

  const loadStats = async () => {
    setLoading(true);
    try {
      const [whList, reasonList, adjList, restockList] = await Promise.allSettled([
        InventoryService.getWarehouses(),
        InventoryService.getInventoryReasons(),
        InventoryService.getInventoryAdjustments(0, 10),
        InventoryService.getRestockRequests(),
      ]);

      const warehouses = whList.status === 'fulfilled' ? whList.value.length : 0;
      const reasons = reasonList.status === 'fulfilled' ? reasonList.value.length : 0;
      const adjustments = adjList.status === 'fulfilled' ? adjList.value.length : 0;
      const restocks = restockList.status === 'fulfilled' ? restockList.value : [];
      const pending = restocks.filter(r => r.status === 'PENDING').length;

      setStats({
        warehouses,
        reasons,
        adjustments,
        restockRequests: restocks.length,
        pendingRestocks: pending,
      });
    } catch {
      // Keep fallbacks
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const cards = [
    {
      emoji: '🏬',
      icon: Warehouse,
      title: 'Manage Warehouses',
      description: 'Storage locations where stock is held, audited, and adjusted.',
      statLabel: 'Active Warehouses',
      statValue: stats.warehouses,
      primaryRoute: '/inventory/warehouse',
      ctaLabel: 'Open Warehouses',
      color: 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-200/60 text-amber-900',
      badgeColor: 'bg-amber-100 text-amber-800',
      pills: [
        { label: 'Add Warehouse', route: '/inventory/warehouse/add', icon: Plus }
      ]
    },
    {
      emoji: '📋',
      icon: ClipboardList,
      title: 'Adjustment Reasons',
      description: 'Reusable reason codes for auditable stock increases and decreases.',
      statLabel: 'Reason Codes',
      statValue: stats.reasons,
      primaryRoute: '/inventory/inventory-reason',
      ctaLabel: 'Open Reasons',
      color: 'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-200/60 text-emerald-900',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      pills: [
        { label: 'Add Reason', route: '/inventory/inventory-reason/add', icon: Plus }
      ]
    },
    {
      emoji: '⚖️',
      icon: Scale,
      title: 'Stock Adjustments',
      description: 'Log physical audit counts, stock damage, and manual adjustments.',
      statLabel: 'Recent Logs',
      statValue: stats.adjustments,
      primaryRoute: '/inventory/inventory-adjustment',
      ctaLabel: 'Open Adjustments',
      color: 'from-indigo-500/10 via-indigo-500/5 to-transparent border-indigo-200/60 text-indigo-900',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      pills: [
        { label: 'New Adjustment', route: '/inventory/inventory-adjustment/add', icon: Plus }
      ]
    },
    {
      emoji: '🔔',
      icon: Bell,
      title: 'Restock Requests',
      description: 'Customer "notify me" requests for out-of-stock items & fabrics.',
      statLabel: 'Pending Alerts',
      statValue: `${stats.pendingRestocks} / ${stats.restockRequests}`,
      primaryRoute: '/inventory/notification',
      ctaLabel: 'Open Restock Requests',
      color: 'from-rose-500/10 via-rose-500/5 to-transparent border-rose-200/60 text-rose-900',
      badgeColor: stats.pendingRestocks > 0 ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-slate-100 text-slate-700',
      pills: []
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <PageHeading heading="Inventory Management" />
          <p className="text-xs text-slate-500 font-normal mt-1">
            Control warehouses, reason codes, stock adjustments, and out-of-stock restock requests ✨
          </p>
        </div>
        <button
          onClick={loadStats}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((c) => {
          const IconComponent = c.icon;
          return (
            <div
              key={c.primaryRoute}
              className={`bg-gradient-to-br ${c.color} bg-white rounded-3xl p-6 shadow-sm border space-y-5 transition-all hover:shadow-md flex flex-col justify-between`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 bg-white rounded-2xl shadow-xs border border-slate-100">{c.emoji}</span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{c.title}</h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${c.badgeColor}`}>
                        {c.statLabel}: {loading ? <Loader2 className="w-3 h-3 inline animate-spin" /> : c.statValue}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {c.description}
                </p>

                {c.pills.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {c.pills.map((pill) => {
                      const PillIcon = pill.icon;
                      return (
                        <Link
                          key={pill.route}
                          href={pill.route}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-2xs"
                        >
                          <PillIcon className="w-3.5 h-3.5" />
                          <span>{pill.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200/50 flex justify-end">
                <Link
                  href={c.primaryRoute}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-xs"
                >
                  <span>{c.ctaLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

