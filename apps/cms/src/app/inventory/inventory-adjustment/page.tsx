'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import { Plus, Eye, Scale, Loader2, RefreshCw, Search } from 'lucide-react';
import { InventoryService, InventoryAdjustmentLite } from '@/services/inventory-service';

export default function InventoryAdjustmentPage() {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [adjustments, setAdjustments] = useState<InventoryAdjustmentLite[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 50;
  const [showLoadMore, setShowLoadMore] = useState(false);
  const [error, setError] = useState('');

  const fetchAdjustments = async (newOffset = 0, isAppend = false) => {
    if (isAppend) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const data = await InventoryService.getInventoryAdjustments(newOffset, limit, searchTerm);
      setShowLoadMore(data.length === limit);
      if (isAppend) {
        setAdjustments((prev) => [...prev, ...data]);
      } else {
        setAdjustments(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory adjustments from backend.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    fetchAdjustments(0, false);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    fetchAdjustments(0, false);
  };

  const handleLoadMore = () => {
    const nextOffset = offset + limit;
    setOffset(nextOffset);
    fetchAdjustments(nextOffset, true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <PageHeading heading="Stock Adjustments" />
          <p className="text-xs text-slate-500 font-normal mt-1">
            Audit logs for manual stock additions, subtractions, and physical counts ⚖️
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAdjustments(0, false)}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/inventory/inventory-adjustment/add"
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Adjustment</span>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter adjustments by SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all"
        >
          Search SKU
        </button>
      </form>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading stock adjustments...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden space-y-4">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4"># REFERENCE NO</th>
                  <th className="px-6 py-4">🏬 WAREHOUSE</th>
                  <th className="px-6 py-4">📋 REASON</th>
                  <th className="px-6 py-4">📅 ADJUSTMENT DATE</th>
                  <th className="px-6 py-4 text-right">DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No stock adjustments recorded.
                    </td>
                  </tr>
                ) : (
                  adjustments.map((adj) => (
                    <tr key={adj.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {adj.referenceNo || `ADJ-${adj.id}`}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {adj.warehouse || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                          {adj.reason || 'General Adjustment'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        {adj.adjustmentDate
                          ? new Date(adj.adjustmentDate).toLocaleDateString('en-GB')
                          : adj.createdAt
                          ? new Date(adj.createdAt).toLocaleDateString('en-GB')
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/inventory/inventory-adjustment/details/${adj.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-xl transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Load More Button */}
          {showLoadMore && (
            <div className="p-4 border-t border-slate-100 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shadow-2xs"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Load More Adjustments</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
