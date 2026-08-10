'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageHeading } from '@/components/ui/PageHeading';
import { ArrowLeft, Loader2, FileText, Download } from 'lucide-react';
import { CatalogService, ArtisanCatalog } from '@/services/catalog-service';

export default function CatalogArtisanPage() {
  const params = useParams();
  const artisanId = params?.id ? String(params.id) : '';

  const [catalogs, setCatalogs] = useState<ArtisanCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (!artisanId) return;
    setLoading(true);
    setError('');
    CatalogService.getCatalogListByArtisan(artisanId)
      .then(data => setCatalogs(data))
      .catch(err => setError(err.message || 'Failed to load artisan catalogs.'))
      .finally(() => setLoading(false));
  }, [artisanId]);

  const handleGeneratePdf = async () => {
    if (!artisanId) return;
    setGeneratingPdf(true);
    try {
      const res = await CatalogService.generateCatalogPdfByArtisan(artisanId);
      if (res.downloadUrl) {
        window.open(res.downloadUrl, '_blank');
      } else {
        alert('Catalog PDF generation initiated.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate catalog PDF.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/manage-catalog" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <PageHeading heading={`Artisan Catalog Profile: Artisan #${artisanId}`} />
        </div>

        <button
          onClick={handleGeneratePdf}
          disabled={generatingPdf}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm"
        >
          {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          <span>Generate Catalog PDF</span>
        </button>
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">Artisan Catalogs ({catalogs.length})</h3>
          <div className="divide-y divide-slate-100">
            {catalogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No catalogs found for this artisan.</p>
            ) : (
              catalogs.map(c => (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                    <p className="text-xs text-slate-500">{c.description || 'No description'}</p>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">{c.catalogItems?.length || 0} items</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
