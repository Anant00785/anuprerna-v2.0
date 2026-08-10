'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import { Plus, Edit2, Warehouse as WarehouseIcon, Loader2, RefreshCw, Search, X, Check } from 'lucide-react';
import { InventoryService, Warehouse } from '@/services/inventory-service';

export default function WarehousePage() {
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; description?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchWarehouses = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await InventoryService.getWarehouses();
      setWarehouses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch warehouse list from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (wh: Warehouse) => {
    setEditingId(wh.id);
    setName(wh.name || '');
    setDescription(wh.description || '');
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errors: { name?: string; description?: string } = {};
    if (!name.trim()) errors.name = 'Name is required';
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
        await InventoryService.updateWarehouse({
          id: editingId,
          name: name.trim(),
          description: description.trim(),
        });
        setToastMessage({ type: 'success', text: 'Warehouse updated successfully' });
      } else {
        await InventoryService.createWarehouse({
          name: name.trim(),
          description: description.trim(),
        });
        setToastMessage({ type: 'success', text: 'Warehouse added successfully' });
      }
      setModalOpen(false);
      fetchWarehouses();
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to save warehouse' });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = warehouses.filter(
    (wh) =>
      (wh.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wh.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <PageHeading heading="Warehouses & Depots" />
          <p className="text-xs text-slate-500 font-normal mt-1">
            Storage locations where stock is held, audited, and adjusted 🏬
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchWarehouses}
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
            <span>Add Warehouse</span>
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
            placeholder="Search warehouse by name or description..."
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

      {/* Warehouses Table / Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading warehouses...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">🏢 WAREHOUSE NAME</th>
                  <th className="px-6 py-4">📝 DESCRIPTION</th>
                  <th className="px-6 py-4">📅 CREATED ON</th>
                  <th className="px-6 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      No warehouses found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((wh) => (
                    <tr key={wh.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm border border-amber-200/50">
                            <WarehouseIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{wh.name}</p>
                            <p className="text-xs font-mono text-slate-400">ID: {wh.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium max-w-xs truncate">
                        {wh.description || '—'}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        {wh.createdAt
                          ? new Date(wh.createdAt).toLocaleDateString('en-GB')
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(wh)}
                            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all"
                            title="Edit Warehouse"
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
                <WarehouseIcon className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingId ? 'Edit Warehouse' : 'Add Warehouse'}
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
                Warehouse Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Main Godown, Artisan Workshop Hub"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border ${
                  formErrors.name ? 'border-rose-400' : 'border-slate-200'
                } rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900`}
              />
              {formErrors.name && (
                <p className="text-rose-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">
                Description *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Central distribution facility in West Bengal."
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
                <span>Save Warehouse</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
