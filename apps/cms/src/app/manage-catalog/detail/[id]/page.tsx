'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageHeading } from '@/components/ui/PageHeading';
import { ArrowLeft, Plus, Eye, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { CatalogService, ArtisanCatalog, ArtisanCatalogItem } from '@/services/catalog-service';

export default function CatalogDetailPreviewPage() {
  const params = useParams();
  const catalogId = params?.id ? String(params.id) : '';

  const [catalog, setCatalog] = useState<ArtisanCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    if (!catalogId) return;
    setLoading(true);
    setError('');
    try {
      const data = await CatalogService.getCatalogById(catalogId);
      setCatalog(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load catalog details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [catalogId]);

  const handleDeleteItem = async () => {
    if (!deletingItemId) return;
    setIsDeleting(true);
    try {
      await CatalogService.deleteCatalogItem(deletingItemId);
      setDeletingItemId(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete catalog item.');
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

  const catalogItems: ArtisanCatalogItem[] = catalog?.catalogItems || [];
  const artisanName = catalog?.artisan?.tenant?.name || catalog?.artisan?.name || 'Artisan';

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link
          href="/manage-catalog"
          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <PageHeading heading={`Manage Catalog: ${catalog?.name || catalogId}`} />
          <p className="text-xs text-slate-500">Catalog item preview table, yarn specifications, swatch codes, and wholesale price tiers</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading catalog specifications...</p>
        </div>
      ) : (
        catalog && (
          <div className="space-y-6">
            {/* Catalog Overview Header Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Catalog Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Catalog Name</label>
                  <input className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none" value={catalog.name || ''} readOnly />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                  <input className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none" value={catalog.description || 'N/A'} readOnly />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Artisan</label>
                  <input className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none" value={artisanName} readOnly />
                </div>
                {catalog.defaultCatalog && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</label>
                    <input className="w-full text-xs font-bold bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-emerald-700 outline-none" value="Default Catalog" readOnly />
                  </div>
                )}
              </div>
            </div>

            {/* Catalog Items Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Manage Catalog Items</h2>
                <p className="text-xs text-slate-500">{catalogItems.length} items in this catalog</p>
              </div>
              <button
                onClick={() => alert('Add Item capability')}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>

            {/* Catalog Items Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Name</th>
                      <th className="px-6 py-3.5">Description</th>
                      <th className="px-6 py-3.5">Quantity</th>
                      <th className="px-6 py-3.5">Price</th>
                      <th className="px-6 py-3.5">Created On</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {catalogItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                          No items in this catalog.
                        </td>
                      </tr>
                    ) : (
                      catalogItems.map((item, idx) => {
                        const media = item.catalogItemMediaList?.[0];
                        const imgUrl = media?.mediaUrl;
                        const dateStr = formatDate(item.createdAt);
                        const curr = item.currency || 'INR';

                        return (
                          <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {imgUrl ? (
                                  <img src={imgUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200">
                                    <ImageIcon className="w-5 h-5" />
                                  </div>
                                )}
                                <span className="font-bold text-slate-900">{item.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">{item.description || 'N/A'}</td>
                            <td className="px-6 py-4">
                              <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-full text-xs font-semibold">
                                {item.quantity ?? 0} {item.unit || ''}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold">
                                {curr} {item.price ?? 0}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">{dateStr}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/manage-catalog/catalog-item/${item.id}`}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                                  title="View Catalog Item"
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>
                                <button
                                  onClick={() => item.id && setDeletingItemId(item.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                                  title="Delete Item"
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
          </div>
        )
      )}

      {/* Delete Item Confirmation Modal */}
      {deletingItemId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Catalog Item</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this catalog item? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingItemId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
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
