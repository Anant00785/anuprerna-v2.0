'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import { Plus, Edit2, ClipboardList, Loader2, RefreshCw, Search, X, Check } from 'lucide-react';
import { InventoryService, InventoryAdjustmentReason } from '@/services/inventory-service';

export default function InventoryReasonPage() {
  const [loading, setLoading] = useState(true);
  const [reasons, setReasons] = useState<InventoryAdjustmentReason[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [description, setDescription] = useState('');
  const [formErrors, setFormErrors] = useState<{ reason?: string; description?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchReasons = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await InventoryService.getInventoryReasons();
      setReasons(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory reasons from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReasons();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setReasonText('');
    setDescription('');
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (r: InventoryAdjustmentReason) => {
    setEditingId(r.id);
    setReasonText(r.reason || '');
    setDescription(r.description || '');
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errors: { reason?: string; description?: string } = {};
    if (!reasonText.trim()) errors.reason = 'Reason is required';
    if (!description.trim()) errors.description = 'Description is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await InventoryService.updateInventoryReason({
          id: editingId,
          reason: reasonText.trim(),
          description: description.trim(),
        });
        setToastMessage({ type: 'success', text: 'Adjustment reason updated successfully' });
      } else {
        await InventoryService.createInventoryReason({
          reason: reasonText.trim(),
          description: description.trim(),
        });
        setToastMessage({ type: 'success', text: 'Adjustment reason added successfully' });
      }
      setModalOpen(false);
      fetchReasons();
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to save inventory reason' });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = reasons.filter(
    (r) =>
      (r.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <PageHeading heading="Inventory Audit Reasons" />
          <p className="text-xs text-slate-500 font-normal mt-1">
            Reusable reason codes for auditable stock increases, damage, and adjustments 📋
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReasons}
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
            <span>Add Reason</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm border ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-slate-200/50 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reason by code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 pr-2">
          Total: {filtered.length}
        </span>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Reasons Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading inventory reasons...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">🏷️ REASON CODE</th>
                  <th className="px-6 py-4">📝 DESCRIPTION</th>
                  <th className="px-6 py-4">📅 CREATED ON</th>
                  <th className="px-6 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      No inventory adjustment reasons found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-200/50">
                            <ClipboardList className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{r.reason}</p>
                            <p className="text-xs font-mono text-slate-400">ID: {r.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium max-w-xs truncate">
                        {r.description || '—'}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString('en-GB')
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(r)}
                            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all"
                            title="Edit Reason"
                          >
                            <Edit2 className="w-4 h-4" />
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

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingId ? 'Edit Adjustment Reason' : 'Add Adjustment Reason'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">
                Reason *
              </label>
              <input
                type="text"
                placeholder="e.g. Damage in Transit, Weaving Completion, Quality Defect"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border ${
                  formErrors.reason ? 'border-rose-400' : 'border-slate-200'
                } rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900`}
              />
              {formErrors.reason && (
                <p className="text-rose-500 text-xs mt-1">{formErrors.reason}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">
                Description *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Used when stock is discarded due to loom quality issues."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border ${
                  formErrors.description ? 'border-rose-400' : 'border-slate-200'
                } rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900`}
              />
              {formErrors.description && (
                <p className="text-rose-500 text-xs mt-1">{formErrors.description}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Save Reason</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
