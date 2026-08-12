'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import { Plus, Search, Eye, Trash2, RefreshCw, Loader2, BookOpen } from 'lucide-react';
import { CatalogService, ArtisanCatalog } from '@/services/catalog-service';

export default function ManageCatalogPage() {
  const [catalogs, setCatalogs] = useState<ArtisanCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await CatalogService.getCatalogList();
      setCatalogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load artisan catalogs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await CatalogService.deleteCatalog(deletingId);
      setDeletingId(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete catalog.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${day}-${month}-${year} @ ${hours}:${minutes} ${ampm}`;
  };

  const filtered = catalogs.filter(c => {
    const term = searchTerm.toLowerCase();
    const name = (c.name || '').toLowerCase();
    const desc = (c.description || '').toLowerCase();
    const artisanName = (c.artisan?.tenant?.name || c.artisan?.name || '').toLowerCase();
    return !searchTerm || name.includes(term) || desc.includes(term) || artisanName.includes(term);
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <PageHeading heading="MANAGE ARTISAN CATALOGS" />
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
        </div>
      </div>

      {/* Purple Count Header Banner */}
      <div className="bg-[#605d86] text-white px-6 py-4 rounded-xl flex items-center justify-between shadow-sm">
        <span className="font-bold text-sm tracking-wider uppercase">
          TOTAL COUNT ({catalogs.length})
        </span>
        <button
          onClick={() => alert('Create New Catalog capability')}
          className="p-1 text-white hover:bg-white/20 rounded-full transition-colors"
          title="Create Catalog"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search catalog by title, description or artisan..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-400"
        />
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading artisan catalogs...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">NAME</th>
                  <th className="px-6 py-3.5">DESCRIPTION</th>
                  <th className="px-6 py-3.5">ARTISAN</th>
                  <th className="px-6 py-3.5">TYPE</th>
                  <th className="px-6 py-3.5 text-center">CATALOG ITEMS</th>
                  <th className="px-6 py-3.5">CREATED ON</th>
                  <th className="px-6 py-3.5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      No artisan catalogs found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((cat, idx) => {
                    const artisanName = cat.artisan?.tenant?.name || cat.artisan?.name || 'Unassigned';
                    const itemsCount = (cat.catalogItems || []).length;
                    const dateStr = formatDate(cat.createdAt);

                    return (
                      <tr key={cat.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 min-w-[12rem]">{cat.name}</td>
                        <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">{cat.description || ''}</td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs font-semibold">
                            {artisanName}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {cat.defaultCatalog && (
                            <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
                              default
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">{itemsCount}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">{dateStr}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={`/manage-catalog/detail/${cat.id}`}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                              title="View Catalog Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => cat.id && setDeletingId(cat.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete Catalog"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Artisan Catalog</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this artisan catalog? This action cannot be undone.
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
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm"
              >
                {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
