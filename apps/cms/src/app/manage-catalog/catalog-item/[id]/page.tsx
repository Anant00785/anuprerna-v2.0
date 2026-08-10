'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageHeading } from '@/components/ui/PageHeading';
import { ArrowLeft, Loader2, Image as ImageIcon } from 'lucide-react';
import { CatalogService, ArtisanCatalogItem } from '@/services/catalog-service';

export default function CatalogItemDetailsPage() {
  const params = useParams();
  const itemId = params?.id ? String(params.id) : '';

  const [item, setItem] = useState<ArtisanCatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!itemId) return;
    setLoading(true);
    setError('');
    CatalogService.getCatalogItemById(itemId)
      .then(data => setItem(data))
      .catch(err => setError(err.message || 'Failed to load catalog item details.'))
      .finally(() => setLoading(false));
  }, [itemId]);

  const mediaList = item?.catalogItemMediaList || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/manage-catalog" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeading heading={`Catalog Item Details: ${item?.name || itemId}`} />
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading item specifications...</p>
        </div>
      ) : (
        item && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">{item.name}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.description || 'No description provided.'}</p>
              
              <div className="pt-3 grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-slate-400 font-bold uppercase text-[10px]">Price</span>
                  <span className="font-bold text-emerald-600 text-sm">{item.currency || 'INR'} {item.price ?? 0}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-slate-400 font-bold uppercase text-[10px]">Quantity</span>
                  <span className="font-bold text-slate-800 text-sm">{item.quantity ?? 0} {item.unit || ''}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">Media Gallery</h3>
              {mediaList.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No media uploaded for this item.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {mediaList.map((m, idx) => (
                    <img key={m.id || idx} src={m.mediaUrl} alt={`Media ${idx + 1}`} className="w-full h-36 object-cover rounded-xl border border-slate-200" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
