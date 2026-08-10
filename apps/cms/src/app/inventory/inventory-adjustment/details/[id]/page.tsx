'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import { ArrowLeft, Loader2, Warehouse, ClipboardList, Calendar, Hash, FileText } from 'lucide-react';
import { InventoryService, InventoryAdjustmentDetail } from '@/services/inventory-service';

export default function InventoryAdjustmentDetailsPage() {
  const params = useParams();
  const id = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [adjustment, setAdjustment] = useState<InventoryAdjustmentDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchDetails(id);
    }
  }, [id]);

  const fetchDetails = async (adjId: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await InventoryService.getInventoryAdjustmentById(adjId);
      setAdjustment(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory adjustment details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl bg-white p-12 rounded-3xl border border-slate-200 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading adjustment details...</p>
      </div>
    );
  }

  if (error || !adjustment) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl">
          {error || 'Adjustment log not found.'}
        </div>
        <Link
          href="/inventory/inventory-adjustment"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Stock Adjustments</span>
        </Link>
      </div>
    );
  }

  const items = adjustment.adjustmentItemList || [];

  return (
    <div className="max-w-4xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/inventory/inventory-adjustment"
          className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <PageHeading heading={`Stock Adjustment Details #${adjustment.id}`} />
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Audit log record & product quantity adjustments
          </p>
        </div>
      </div>

      {/* Metadata Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase">
            <Hash className="w-3.5 h-3.5" />
            <span>Reference No</span>
          </div>
          <p className="font-mono font-bold text-slate-900 text-sm">
            {adjustment.referenceNo || `ADJ-${adjustment.id}`}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase">
            <Warehouse className="w-3.5 h-3.5" />
            <span>Warehouse</span>
          </div>
          <p className="font-bold text-slate-900 text-sm">
            {adjustment.warehouse?.name || '—'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Reason</span>
          </div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
            {adjustment.reason?.reason || 'General Adjustment'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase">
            <Calendar className="w-3.5 h-3.5" />
            <span>Adjustment Date</span>
          </div>
          <p className="font-mono font-bold text-slate-900 text-sm">
            {adjustment.adjustmentDate
              ? new Date(adjustment.adjustmentDate).toLocaleDateString('en-GB')
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Description Card if present */}
      {adjustment.description && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase">
            <FileText className="w-3.5 h-3.5" />
            <span>Notes & Description</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {adjustment.description}
          </p>
        </div>
      )}

      {/* Adjustment Items Breakdown Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden space-y-4 p-6">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-3">
          Adjusted Products ({items.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs">
              <tr>
                <th className="px-4 py-3">PRODUCT</th>
                <th className="px-4 py-3 text-center">QTY AVAILABLE</th>
                <th className="px-4 py-3 text-center">QTY ADJUSTED</th>
                <th className="px-4 py-3 text-center">RESULTING AT-HAND</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No items recorded for this adjustment.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.productId || idx} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.productImage || item.product?.heroImage ? (
                          <img
                            src={item.productImage || item.product?.heroImage}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs">
                            IMG
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 text-xs">
                            {item.productName || item.product?.name || `Product #${item.productId}`}
                          </p>
                          <p className="text-xs font-mono text-slate-400">
                            {item.product?.sku || `ID: ${item.productId}`}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center font-bold text-slate-700">
                      {item.quantityAvailable}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          item.quantityAdjusted > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.quantityAdjusted < 0
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.quantityAdjusted > 0 ? `+${item.quantityAdjusted}` : item.quantityAdjusted}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center font-bold text-slate-900">
                      {item.quantityAtHand}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
