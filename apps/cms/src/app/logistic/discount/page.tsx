'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Loader2, RefreshCw, X, Check, Tag } from 'lucide-react';
import { LogisticService, DiscountCoupon } from '@/services/logistic-service';

export default function ManageDiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [type, setType] = useState<'FREE_SHIPPING' | 'PERCENTAGE_OFF' | 'FLAT_OFF'>('PERCENTAGE_OFF');
  const [value, setValue] = useState('');
  const [method, setMethod] = useState<'AUTOMATIC' | 'MANUAL'>('MANUAL');
  const [couponCode, setCouponCode] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [location, setLocation] = useState<'DOMESTIC' | 'INTERNATIONAL' | 'ALL'>('DOMESTIC');
  const [usage, setUsage] = useState<'REUSABLE' | 'SINGLE_USE'>('REUSABLE');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await LogisticService.getDiscounts();
      setDiscounts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load discount coupons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setType('PERCENTAGE_OFF');
    setValue('10% off');
    setMethod('MANUAL');
    setCouponCode('');
    setMinOrderAmount('1000');
    setLocation('DOMESTIC');
    setUsage('REUSABLE');
    setValidFrom(new Date().toISOString().split('T')[0]);
    setValidTo('2026-12-31');
    setActive(true);
    setModalOpen(true);
  };

  const openEditModal = (d: DiscountCoupon) => {
    setEditingId(d.id || null);
    setType(d.type || 'PERCENTAGE_OFF');
    setValue(d.value || '');
    setMethod(d.method || 'MANUAL');
    setCouponCode(d.couponCode || '');
    setMinOrderAmount(String(d.minOrderAmount || ''));
    setLocation(d.location || 'DOMESTIC');
    setUsage(d.usage || 'REUSABLE');
    setValidFrom(d.validFrom || '');
    setValidTo(d.validTo || '');
    setActive(d.active ?? true);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || !value.trim()) return;
    setSubmitting(true);
    try {
      const payload: Partial<DiscountCoupon> = {
        id: editingId || Date.now(),
        type,
        value: value.trim(),
        method,
        couponCode: couponCode.trim().toUpperCase(),
        minOrderAmount: parseFloat(minOrderAmount) || 0,
        location,
        usage,
        validFrom,
        validTo,
        active,
      };

      if (editingId) {
        await LogisticService.updateDiscount(payload);
        setDiscounts(prev => prev.map(d => d.id === editingId ? { ...d, ...payload } as DiscountCoupon : d));
      } else {
        await LogisticService.createDiscount(payload);
        setDiscounts(prev => [payload as DiscountCoupon, ...prev]);
      }
      setModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await LogisticService.deleteDiscount(deletingId);
      setDiscounts(prev => prev.filter(d => d.id !== deletingId));
      setDeletingId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete discount coupon.');
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = discounts.filter(d => d.active).length;
  const inactiveCount = discounts.filter(d => !d.active).length;

  const filtered = discounts.filter(d => {
    if (activeTab === 'ACTIVE') return d.active;
    if (activeTab === 'INACTIVE') return !d.active;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-100/80 rounded-2xl text-2xl">🎟️</div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Discounts</h1>
            <p className="text-xs text-slate-500 font-normal">
              Coupons & cart-level promotions ✨
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Discount</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-2xl transition-all ${
            activeTab === 'ALL'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({discounts.length})
        </button>
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-1.5 ${
            activeTab === 'ACTIVE'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>✅</span> Active ({activeCount})
        </button>
        <button
          onClick={() => setActiveTab('INACTIVE')}
          className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-1.5 ${
            activeTab === 'INACTIVE'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>💤</span> Inactive ({inactiveCount})
        </button>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading promotional discounts...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">🏷️ TYPE</th>
                  <th className="px-6 py-4">💸 VALUE</th>
                  <th className="px-6 py-4">🕹️ METHOD</th>
                  <th className="px-6 py-4">🏷️ COUPON</th>
                  <th className="px-6 py-4">📊 MIN ORDER</th>
                  <th className="px-6 py-4">🌍 LOCATION</th>
                  <th className="px-6 py-4">🔄 USAGE</th>
                  <th className="px-6 py-4">📅 VALIDITY</th>
                  <th className="px-6 py-4">✅ STATUS</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-slate-400">
                      No discounts configured.
                    </td>
                  </tr>
                ) : (
                  filtered.map((d, idx) => (
                    <tr key={d.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                          d.type === 'FREE_SHIPPING'
                            ? 'bg-purple-100 text-purple-800'
                            : d.type === 'PERCENTAGE_OFF'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {d.type === 'FREE_SHIPPING' ? '🚚 Free Shipping' : d.type === 'PERCENTAGE_OFF' ? '🏷️ % Off' : '💰 Flat Off'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{d.value}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-600">
                        {d.method === 'AUTOMATIC' ? '🍵 Automatic' : '🖐️ Manual'}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-indigo-700 bg-indigo-50/60 px-3 py-1 rounded-lg text-xs w-fit">
                        {d.couponCode}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">₹{d.minOrderAmount}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {d.location === 'DOMESTIC' ? '🏫 Domestic' : d.location === 'INTERNATIONAL' ? '✈️ International' : '🌐 All'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">{d.usage === 'REUSABLE' ? 'Reusable' : 'Single use'}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{d.validFrom} → {d.validTo}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          d.active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {d.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(d)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                            title="Edit Discount"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => d.id && setDeletingId(d.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Delete Discount"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Discount Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">{editingId ? 'Edit Discount Coupon' : 'Add Discount Coupon'}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Discount Type *</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900">
                  <option value="PERCENTAGE_OFF">Percentage Off</option>
                  <option value="FREE_SHIPPING">Free Shipping</option>
                  <option value="FLAT_OFF">Flat Off</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Discount Value *</label>
                <input type="text" required placeholder="e.g. 20% off, Free shipping" value={value} onChange={e => setValue(e.target.value)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Coupon Code *</label>
                <input type="text" required placeholder="e.g. KARIM20" value={couponCode} onChange={e => setCouponCode(e.target.value)} className="w-full px-3.5 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Min Order Amount (₹)</label>
                <input type="number" placeholder="e.g. 200000" value={minOrderAmount} onChange={e => setMinOrderAmount(e.target.value)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Location Target</label>
                <select value={location} onChange={e => setLocation(e.target.value as any)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900">
                  <option value="DOMESTIC">Domestic</option>
                  <option value="INTERNATIONAL">International</option>
                  <option value="ALL">All Locations</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Usage Limit</label>
                <select value={usage} onChange={e => setUsage(e.target.value as any)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900">
                  <option value="REUSABLE">Reusable</option>
                  <option value="SINGLE_USE">Single use</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Valid From</label>
                <input type="text" placeholder="May 28, 2024" value={validFrom} onChange={e => setValidFrom(e.target.value)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Valid To</label>
                <input type="text" placeholder="Mar 31, 2026" value={validTo} onChange={e => setValidTo(e.target.value)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="couponActive" checked={active} onChange={e => setActive(e.target.checked)} className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
              <label htmlFor="couponActive" className="text-xs font-semibold text-slate-700">Coupon Active</label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm">
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Coupon</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Discount Coupon</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this discount coupon? This action cannot be undone.
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
