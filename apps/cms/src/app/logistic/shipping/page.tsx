'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Loader2, RefreshCw, X, Check, Truck } from 'lucide-react';
import { LogisticService, ShipmentRate } from '@/services/logistic-service';

export default function ManageShippingPage() {
  const [shipments, setShipments] = useState<ShipmentRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'DOMESTIC' | 'INTERNATIONAL'>('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [shipmentType, setShipmentType] = useState<'DOMESTIC' | 'INTERNATIONAL'>('DOMESTIC');
  const [name, setName] = useState('');
  const [baseCharge, setBaseCharge] = useState('');
  const [baseUnitsLimit, setBaseUnitsLimit] = useState('5');
  const [perExtraUnitRate, setPerExtraUnitRate] = useState('');
  const [estimatedDeliveryTimeline, setEstimatedDeliveryTimeline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await LogisticService.getShipments();
      setShipments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load shipping rates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setShipmentType('DOMESTIC');
    setName('');
    setBaseCharge('');
    setBaseUnitsLimit('5');
    setPerExtraUnitRate('');
    setEstimatedDeliveryTimeline('3–5 days');
    setModalOpen(true);
  };

  const openEditModal = (item: ShipmentRate) => {
    setEditingId(item.id || null);
    setShipmentType(item.shipmentType || 'DOMESTIC');
    setName(item.name || '');
    setBaseCharge(String(item.baseCharge || ''));
    setBaseUnitsLimit(String(item.baseUnitsLimit || 5));
    setPerExtraUnitRate(String(item.perExtraUnitRate || ''));
    setEstimatedDeliveryTimeline(item.estimatedDeliveryTimeline || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !baseCharge) return;
    setSubmitting(true);
    try {
      const payload: Partial<ShipmentRate> = {
        id: editingId || Date.now(),
        shipmentType,
        name: name.trim(),
        baseCharge: parseFloat(baseCharge) || 0,
        baseUnitsLimit: parseInt(baseUnitsLimit) || 5,
        perExtraUnitRate: parseFloat(perExtraUnitRate) || 0,
        estimatedDeliveryTimeline: estimatedDeliveryTimeline.trim(),
      };

      if (editingId) {
        await LogisticService.updateShipment(payload);
        setShipments(prev => prev.map(s => s.id === editingId ? { ...s, ...payload } as ShipmentRate : s));
      } else {
        await LogisticService.createShipment(payload);
        setShipments(prev => [payload as ShipmentRate, ...prev]);
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
      await LogisticService.deleteShipment(deletingId);
      setShipments(prev => prev.filter(s => s.id !== deletingId));
      setDeletingId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete shipping rate.');
    } finally {
      setDeleting(false);
    }
  };

  const domesticCount = shipments.filter(s => s.shipmentType === 'DOMESTIC').length;
  const internationalCount = shipments.filter(s => s.shipmentType === 'INTERNATIONAL').length;

  const filtered = shipments.filter(s => {
    if (activeTab === 'DOMESTIC') return s.shipmentType === 'DOMESTIC';
    if (activeTab === 'INTERNATIONAL') return s.shipmentType === 'INTERNATIONAL';
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-100/80 rounded-2xl text-2xl">🚚</div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Shipping Rates</h1>
            <p className="text-xs text-slate-500 font-normal">
              Delivery pricing tiers & estimated timelines ✨
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
            <span>Add Rate</span>
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
          All ({shipments.length})
        </button>
        <button
          onClick={() => setActiveTab('DOMESTIC')}
          className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-1.5 ${
            activeTab === 'DOMESTIC'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>🏫</span> Domestic ({domesticCount})
        </button>
        <button
          onClick={() => setActiveTab('INTERNATIONAL')}
          className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-1.5 ${
            activeTab === 'INTERNATIONAL'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>✈️</span> International ({internationalCount})
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
          <p className="text-sm text-slate-500 font-medium">Loading shipping rates...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">🌎 TYPE</th>
                  <th className="px-6 py-4">🏷️ NAME</th>
                  <th className="px-6 py-4">💰 BASE CHARGE</th>
                  <th className="px-6 py-4">➕ PER EXTRA UNIT</th>
                  <th className="px-6 py-4">🚚 DELIVERY</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No shipping rates configured.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s, idx) => (
                    <tr key={s.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                          s.shipmentType === 'DOMESTIC'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {s.shipmentType === 'DOMESTIC' ? '🏫 Domestic' : '✈️ International'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{s.name}</td>
                      <td className="px-6 py-4 text-slate-800 font-semibold">
                        ₹{s.baseCharge} <span className="text-xs text-slate-400 font-normal">• {s.baseUnitsLimit} units</span>
                      </td>
                      <td className="px-6 py-4 text-slate-800 font-semibold">
                        ₹{s.perExtraUnitRate}<span className="text-xs text-slate-400 font-normal">/unit</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-600">{s.estimatedDeliveryTimeline}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                            title="Edit Rate"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => s.id && setDeletingId(s.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Delete Rate"
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

      {/* Add / Edit Shipping Rate Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">{editingId ? 'Edit Shipping Rate' : 'Add Shipping Rate'}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Shipment Type *</label>
              <select value={shipmentType} onChange={e => setShipmentType(e.target.value as any)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900">
                <option value="DOMESTIC">Domestic</option>
                <option value="INTERNATIONAL">International</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Method Name *</label>
              <input type="text" required placeholder="e.g. Express - By Air, Regular - By Road" value={name} onChange={e => setName(e.target.value)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Base Charge (₹) *</label>
                <input type="number" required placeholder="e.g. 200" value={baseCharge} onChange={e => setBaseCharge(e.target.value)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Base Units Limit</label>
                <input type="number" required placeholder="e.g. 5" value={baseUnitsLimit} onChange={e => setBaseUnitsLimit(e.target.value)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Per Extra Unit Rate (₹) *</label>
              <input type="number" required placeholder="e.g. 15" value={perExtraUnitRate} onChange={e => setPerExtraUnitRate(e.target.value)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Estimated Delivery Timeline *</label>
              <input type="text" required placeholder="e.g. 3–4 days, 10–20 days" value={estimatedDeliveryTimeline} onChange={e => setEstimatedDeliveryTimeline(e.target.value)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm">
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Rate</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Shipping Rate</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this shipping rate? This action cannot be undone.
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
