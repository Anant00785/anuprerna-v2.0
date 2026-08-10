'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ExternalLink, Trash2, Loader2, RefreshCw, BarChart2, HelpCircle, Calendar, Clock } from 'lucide-react';
import { LogisticService, CustomerOrder } from '@/services/logistic-service';

export default function ManageOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('AWAITING');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      let data: CustomerOrder[] = [];
      if (searchTerm.trim()) {
        data = await LogisticService.searchOrders(searchTerm.trim());
      } else {
        data = await LogisticService.getOrders(activeTab, 0, 100);
      }
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load live orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await LogisticService.deleteOrder(deletingId);
      setOrders(prev => prev.filter(o => o.id !== deletingId));
      setDeletingId(null);
    } catch (err: any) {
      setOrders(prev => prev.filter(o => o.id !== deletingId));
      setDeletingId(null);
    } finally {
      setDeleting(false);
    }
  };

  // Metrics
  const statsTotal = orders.length;
  const statsAwaiting = orders.filter(o => !o.status || o.status.toUpperCase() === 'AWAITING' || o.status.toUpperCase() === 'PROCESSING').length;
  const statsOverdue = orders.filter(o => o.isOverdue).length;
  const statsInTransit = orders.filter(o => o.status && o.status.toUpperCase() === 'IN_TRANSIT').length;

  // Filtered List
  const filtered = orders.filter(o => {
    const term = searchTerm.toLowerCase();
    const idStr = (o.orderId || o.id || '').toString().toLowerCase();
    const name = (o.buyerName || o.customerName || '').toLowerCase();
    const email = (o.customerEmail || o.email || '').toLowerCase();
    return !searchTerm || idStr.includes(term) || name.includes(term) || email.includes(term);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 rounded-2xl text-2xl">🧾</div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Orders</h1>
            <p className="text-xs text-slate-500 font-normal">
              The operational view of every customer order — triage by status, expand a row to see workflow progress, or open it for full detail.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Order management guide: Click View order details to inspect items, workflow steps, and shipping status.')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>How to read this page</span>
          </button>
          <button
            onClick={() => alert('Order analytics overview')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh active tab</span>
          </button>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-slate-700 flex items-center justify-center text-2xl shadow-sm">
            🧾
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{statsTotal}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL LOADED</div>
          </div>
        </div>

        <div className="bg-amber-50/50 p-5 rounded-3xl border border-amber-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-amber-600 flex items-center justify-center text-2xl shadow-sm">
            ⏳
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{statsAwaiting}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AWAITING</div>
          </div>
        </div>

        <div className="bg-rose-50/50 p-5 rounded-3xl border border-rose-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-rose-600 flex items-center justify-center text-2xl shadow-sm">
            ⏰
          </div>
          <div>
            <div className={`text-2xl font-black ${statsOverdue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {statsOverdue > 0 ? statsOverdue : '—'}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OVERDUE</div>
          </div>
        </div>

        <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-slate-700 flex items-center justify-center text-2xl shadow-sm">
            🚚
          </div>
          <div>
            <div className="text-2xl font-black text-slate-400">
              {statsInTransit > 0 ? statsInTransit : '—'}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IN TRANSIT</div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search every order — ID • full email • customer name • product SKU"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') loadData(); }}
          className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-400"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        {[
          { id: 'AWAITING', label: 'Awaiting' },
          { id: 'PARTIALLY_FULFILLED', label: 'Partially Fulfilled' },
          { id: 'IN_TRANSIT', label: 'In Transit' },
          { id: 'FULFILLED', label: 'Fulfilled' },
          { id: 'INCOMPLETE', label: 'Incomplete' },
          { id: 'FAILED', label: 'Failed' },
          { id: 'CANCELLED', label: 'Cancelled' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-2xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white font-bold shadow-sm'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            {tab.label} ({activeTab === tab.id ? orders.length : '—'})
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading live order roster...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-right text-xs text-slate-400 font-medium">
            Showing 1–{filtered.length} of {orders.length}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-sm">
              No orders found matching the filter criteria.
            </div>
          ) : (
            filtered.map(order => {
              const orderNum = order.orderId || order.id;
              const name = order.buyerName || order.customerName || 'Customer';
              const email = order.customerEmail || order.email || '';
              const currencyStr = order.currency || 'INR';
              const totalVal = order.formattedTotal || (order.totalAmount || order.totalPrice ? `${currencyStr} ${order.totalAmount || order.totalPrice}` : 'INR 0.00');

              return (
                <div key={order.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all">
                  {/* Top Line */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="bg-amber-100/80 text-amber-800 text-xs font-bold px-3 py-1 rounded-xl">
                        Awaiting
                      </span>
                      <span className="font-bold text-amber-700 text-sm">#{orderNum}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-bold text-slate-900 text-sm">{name}</span>
                      {email && <span className="text-xs text-slate-400">{email}</span>}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-900 text-base">{totalVal}</span>
                      <Link
                        href={`/logistic/order/${order.id}`}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View order details</span>
                      </Link>
                      <button
                        onClick={() => setDeletingId(order.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Delete Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sub Line Badges & Stats */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-lg text-[11px]">
                        {order.paymentStatus || 'Paid'}
                      </span>
                      <span className="bg-amber-800/10 text-amber-900 font-bold px-2.5 py-0.5 rounded-lg text-[11px]">
                        {order.productType || 'Fabric'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.startDate || '10 Aug'} → {order.endDate || '11 Aug'}</span>
                      <span className="text-slate-300">•</span>
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>07 Aug, 7:11 PM</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <span>{order.itemsCount || 1} items</span>
                      <span className="text-slate-300">•</span>
                      <span>{order.inProductionCount || 0} in production</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-emerald-600 font-semibold">{order.readyCount || 0} ready</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Order</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this order? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm"
              >
                {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
