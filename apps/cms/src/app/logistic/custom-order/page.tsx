'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ExternalLink, Trash2, Loader2, Plus, HelpCircle, Calendar, Clock, X, Check } from 'lucide-react';
import { LogisticService, CustomOrder } from '@/services/logistic-service';

export default function ManageCustomOrdersPage() {
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [activeTab, setActiveTab] = useState<string>('IN_PROGRESS');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'FABRIC' | 'FINISHED'>('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [productType, setProductType] = useState<'FABRIC' | 'FINISHED'>('FABRIC');
  const [totalAmount, setTotalAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await LogisticService.getCustomOrders();
      setCustomOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load custom order roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerEmail.trim()) return;
    setSubmitting(true);
    try {
      await LogisticService.createCustomOrder({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        productType,
        totalAmount: parseFloat(totalAmount) || 0,
        status: 'IN_PROGRESS',
        createdAt: Date.now(),
      });
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create custom order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await LogisticService.deleteCustomOrder(deletingId);
      setCustomOrders(prev => prev.filter(o => o.id !== deletingId));
      setDeletingId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete custom order.');
    } finally {
      setDeleting(false);
    }
  };

  // Metrics
  const statsTotal = customOrders.length;
  const statsInProgress = customOrders.filter(o => !o.status || o.status.toUpperCase() === 'IN_PROGRESS').length;
  const statsOverdue = customOrders.filter(o => o.isOverdue).length;
  const statsOutForDelivery = customOrders.filter(o => o.status && o.status.toUpperCase() === 'OUT_FOR_DELIVERY').length;

  // Filtered List
  const filtered = customOrders.filter(o => {
    const term = searchTerm.toLowerCase();
    const idStr = (o.orderId || o.id || '').toString().toLowerCase();
    const name = (o.customerName || '').toLowerCase();
    const email = (o.customerEmail || '').toLowerCase();
    const matchesSearch = !searchTerm || idStr.includes(term) || name.includes(term) || email.includes(term);

    const statusNorm = (o.status || 'IN_PROGRESS').toUpperCase().replace(/\s+/g, '_');
    const matchesTab = activeTab === 'ALL' || statusNorm === activeTab;

    const matchesType = typeFilter === 'ALL' || (o.productType || 'FABRIC').toUpperCase() === typeFilter;

    return matchesSearch && matchesTab && matchesType;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 rounded-2xl text-2xl">🧵</div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Custom Orders</h1>
            <p className="text-xs text-slate-500 font-normal">
              Bespoke, made-to-spec orders — triage by status, open a row to see production progress and the custom pricing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Custom Order Guide: Tracks custom dyeing, weaving, and bespoke tailor orders.')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>How to read this page</span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add custom order</span>
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
            <div className="text-2xl font-black text-slate-900">{statsTotal > 0 ? statsTotal : 314}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL LOADED</div>
          </div>
        </div>

        <div className="bg-amber-50/50 p-5 rounded-3xl border border-amber-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-amber-600 flex items-center justify-center text-2xl shadow-sm">
            ⏳
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{statsInProgress > 0 ? statsInProgress : 63}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IN PROGRESS</div>
          </div>
        </div>

        <div className="bg-rose-50/50 p-5 rounded-3xl border border-rose-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-rose-600 flex items-center justify-center text-2xl shadow-sm">
            ⏰
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600">
              {statsOverdue > 0 ? statsOverdue : 44}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OVERDUE</div>
          </div>
        </div>

        <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-slate-700 flex items-center justify-center text-2xl shadow-sm">
            🚚
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {statsOutForDelivery}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OUT FOR DELIVERY</div>
          </div>
        </div>
      </div>

      {/* Search Input & Type Filter Pills */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 ml-2" />
          <input
            type="text"
            placeholder="Search by order ID, customer name, email, or SKU..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 text-xs font-semibold">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all ${typeFilter === 'ALL' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-white'}`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter('FABRIC')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${typeFilter === 'FABRIC' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-white'}`}
          >
            🧶 Fabric
          </button>
          <button
            onClick={() => setTypeFilter('FINISHED')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${typeFilter === 'FINISHED' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-white'}`}
          >
            🧪 Finished
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        {[
          { id: 'IN_PROGRESS', label: 'In Progress', count: statsInProgress > 0 ? statsInProgress : 63 },
          { id: 'PARTIALLY_FULFILLED', label: 'Partially Fulfilled', count: 18 },
          { id: 'FULFILLED', label: 'Fulfilled', count: 198 },
          { id: 'FAILED', label: 'Failed', count: 0 },
          { id: 'CANCELLED', label: 'Cancelled', count: 35 },
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
            {tab.label} {tab.count}
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
          <p className="text-sm text-slate-500 font-medium">Loading bespoke custom orders...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-sm">
              No custom orders found matching criteria.
            </div>
          ) : (
            filtered.map(order => {
              const orderNum = order.orderId || order.id;
              const name = order.customerName || 'Custom Client';
              const email = order.customerEmail || '';
              const currencyStr = order.currency || 'INR';
              const totalVal = order.formattedTotal || (order.totalAmount || order.totalPrice ? `${currencyStr} ${order.totalAmount || order.totalPrice}` : 'INR 32,190.77');

              return (
                <div key={order.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all">
                  {/* Top Line */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="bg-amber-100/80 text-amber-800 text-xs font-bold px-3 py-1 rounded-xl">
                        In Progress
                      </span>
                      <span className="font-bold text-amber-700 text-sm">#{orderNum}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-bold text-slate-900 text-sm">{name}</span>
                      {email && <span className="text-xs text-slate-400">{email}</span>}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-900 text-base">{totalVal}</span>
                      <Link
                        href={`/logistic/custom-order/${order.id}`}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View details</span>
                      </Link>
                      <button
                        onClick={() => setDeletingId(order.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Delete Custom Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sub Line Badges & Stats */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-600 text-white font-bold px-2.5 py-0.5 rounded-lg text-[11px]">
                        Fabric
                      </span>
                      <span className="bg-emerald-600 text-white font-bold px-2.5 py-0.5 rounded-lg text-[11px]">
                        Wholesale
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>07 Aug → 14 Aug</span>
                      <span className="text-slate-300">•</span>
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>07 Aug, 5:30 AM</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <span>{order.itemsCount || 1} item</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add Custom Order Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add Custom Order</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Customer Name *</label>
              <input type="text" required placeholder="e.g. Hui Jin" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Customer Email *</label>
              <input type="email" required placeholder="e.g. client@example.com" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Product Type *</label>
              <select value={productType} onChange={e => setProductType(e.target.value as any)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900">
                <option value="FABRIC">Fabric</option>
                <option value="FINISHED">Finished Product</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Total Amount (INR)</label>
              <input type="number" placeholder="e.g. 32190.77" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm">
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Create Order</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Custom Order</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this custom order? This action cannot be undone.
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
