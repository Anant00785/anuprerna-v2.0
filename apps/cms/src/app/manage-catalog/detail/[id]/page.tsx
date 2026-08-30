'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  Plus,
  Eye,
  Trash2,
  Loader2,
  X,
  Package,
  ExternalLink,
} from 'lucide-react';
import { CatalogService, ArtisanCatalog, ArtisanCatalogItem } from '@/services/catalog-service';

export default function CatalogDetailPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const catalogId = resolvedParams.id;

  const [catalog, setCatalog] = useState<ArtisanCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lightbox / Item View Modal
  const [selectedItem, setSelectedItem] = useState<ArtisanCatalogItem | null>(null);

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

    return `${day}-${month}-${year} @ ${hours}:${minutes}${ampm}`;
  };

  const catalogItems: ArtisanCatalogItem[] = catalog?.catalogItems || [];
  const artisanName =
    catalog?.artisan?.tenant?.name ||
    catalog?.artisan?.name ||
    'Mursidabad Adarsha Mahila Handloom';

  const countString = String(catalogItems.length).padStart(2, '0');

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#585c82] animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading catalog specifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-2 pb-16 max-w-6xl">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/manage-catalog" className="hover:text-slate-900">
          Manage Catalog
        </Link>
        <span>/</span>
        <span>Detail</span>
        <span>/</span>
        <span className="bg-[#1f2438] text-white px-2.5 py-0.5 rounded-full font-bold text-[10px]">
          {catalogId}
        </span>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* TOP SECTION: MANAGE CATALOG */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-6">
        <h2 className="text-sm font-bold text-[#1f2438]">Manage Catalog</h2>

        <div className="space-y-4">
          {/* ROW 1: CATALOG NAME + DESCRIPTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Catalog Name
              </label>
              <input
                type="text"
                readOnly
                value={catalog?.name || 'Khadi x Khadi Fabric'}
                className="w-full bg-[#ebebeb] border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none cursor-default"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description
              </label>
              <input
                type="text"
                readOnly
                value={catalog?.description || ''}
                className="w-full bg-[#ebebeb] border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none cursor-default"
              />
            </div>
          </div>

          {/* ROW 2: ARTISAN + TYPE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Artisan
              </label>
              <input
                type="text"
                readOnly
                value={artisanName}
                className="w-full bg-[#ebebeb] border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none cursor-default"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Type
              </label>
              <input
                type="text"
                readOnly
                value={catalog?.defaultCatalog ? 'Default Catalog' : 'Standard Catalog'}
                className="w-full bg-[#ebebeb] border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none cursor-default"
              />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: MANAGE CATALOG ITEMS */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-[#1f2438] uppercase tracking-wider">
          MANAGE CATALOG ITEMS
        </h2>

        {/* PURPLE HEADER BANNER */}
        <div className="bg-[#585c82] text-white px-4 py-2.5 rounded-t-lg flex items-center justify-between shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider">
            TOTAL COUNT ({countString})
          </span>
          <Link
            href={`/manage-catalog/catalog-item/create?catalogId=${catalogId}`}
            className="w-5 h-5 rounded-full border border-white/70 flex items-center justify-center hover:bg-white/20 transition-colors"
            title="Add Catalog Item"
          >
            <Plus className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-b-2xl border border-slate-200/70 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-white text-slate-400 font-bold tracking-tight">
                  <th className="py-4 px-6">NAME</th>
                  <th className="py-4 px-6">DESCRIPTION</th>
                  <th className="py-4 px-6">QUANTITY</th>
                  <th className="py-4 px-6">PRICE</th>
                  <th className="py-4 px-6">CREATED ON</th>
                  <th className="py-4 px-6 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {catalogItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No items in this catalog.
                    </td>
                  </tr>
                ) : (
                  catalogItems.map((item, idx) => {
                    const media = item.catalogItemMediaList?.[0];
                    const imgUrl = media?.mediaUrl || (item as any).image || (item as any).heroImage || '';
                    const dateStr = formatDate(item.createdAt || (item as any).timeOfCreation);
                    const curr = item.currency || 'INR';

                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        {/* NAME */}
                        <td className="py-3 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={item.name}
                                className="w-10 h-10 rounded-md object-cover bg-slate-100 border border-slate-200 shadow-2xs"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <span className="font-semibold text-slate-800">{item.name}</span>
                          </div>
                        </td>

                        {/* DESCRIPTION */}
                        <td className="py-3 px-6 text-slate-500 max-w-md truncate">
                          {item.description || 'warp: 33 khadi, weft 33 khadi, Width 45", Lenth 10-12 meter each Roll'}
                        </td>

                        {/* QUANTITY */}
                        <td className="py-3 px-6 whitespace-nowrap">
                          <span className="bg-[#f0f4f9] text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
                            {item.quantity ?? 60}
                          </span>
                        </td>

                        {/* PRICE */}
                        <td className="py-3 px-6 whitespace-nowrap">
                          <span className="bg-[#e6f7ef] text-[#18a058] px-2.5 py-0.5 rounded-full text-xs font-bold">
                            {curr} {item.price ?? 230}
                          </span>
                        </td>

                        {/* CREATED ON */}
                        <td className="py-3 px-6 whitespace-nowrap text-slate-500 font-medium">
                          {dateStr || '28-03-2025 @ 12:51PM'}
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3 px-6 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-3">
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="text-slate-600 hover:text-slate-900 transition-colors p-1"
                              title="View Catalog Item"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => item.id && setDeletingItemId(item.id)}
                              className="text-slate-600 hover:text-rose-600 transition-colors p-1"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

      {/* VIEW ITEM MODAL / LIGHTBOX */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in zoom-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#1f2438]">{selectedItem.name}</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedItem.catalogItemMediaList?.[0]?.mediaUrl && (
              <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={selectedItem.catalogItemMediaList[0].mediaUrl}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-2 text-xs">
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">
                {selectedItem.description}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Price</span>
                  <span className="text-sm font-extrabold text-emerald-600">
                    {selectedItem.currency || 'INR'} {selectedItem.price}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Quantity</span>
                  <span className="text-sm font-bold text-slate-700">
                    {selectedItem.quantity ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingItemId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
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
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
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
