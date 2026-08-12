'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { InventoryService, Warehouse } from '@/services/inventory-service';

export default function UpdateWarehousePage() {
  const router = useRouter();
  const params = useParams();
  const warehouseId = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (warehouseId) {
      loadWarehouse(warehouseId);
    }
  }, [warehouseId]);

  const loadWarehouse = async (id: number) => {
    setLoading(true);
    try {
      const wh = await InventoryService.getWarehouseById(id);
      if (wh) {
        setName(wh.name || '');
        setDescription(wh.description || '');
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to fetch warehouse details.');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const err: { name?: string; description?: string } = {};
    if (!name.trim()) err.name = 'Name is required';
    if (!description.trim()) err.description = 'Description is required';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setApiError('');
    try {
      await InventoryService.updateWarehouse({
        id: warehouseId,
        name: name.trim(),
        description: description.trim(),
      });
      router.push('/inventory/warehouse');
    } catch (err: any) {
      setApiError(err.message || 'Failed to update warehouse');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl bg-white p-12 rounded-3xl border border-slate-200 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading warehouse details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link
          href="/inventory/warehouse"
          className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <PageHeading heading={`Edit Warehouse #${warehouseId}`} />
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Modify warehouse metadata and description
          </p>
        </div>
      </div>

      {apiError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div>
          <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">
            Warehouse Name *
          </label>
          <input
            type="text"
            placeholder="e.g. Central Warehouse Hub"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border ${
              errors.name ? 'border-rose-400' : 'border-slate-200'
            } rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900`}
          />
          {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">
            Description *
          </label>
          <textarea
            rows={4}
            placeholder="e.g. Primary facility for raw materials & fabric stock."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border ${
              errors.description ? 'border-rose-400' : 'border-slate-200'
            } rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900`}
          />
          {errors.description && <p className="text-rose-500 text-xs mt-1">{errors.description}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Link
            href="/inventory/warehouse"
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>Update Warehouse</span>
          </button>
        </div>
      </form>
    </div>
  );
}
