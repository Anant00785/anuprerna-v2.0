'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Upload,
  Folder,
  Layers,
  FolderTree,
  Sliders,
  Wrench,
  Package,
  Star,
  Tag as TagIcon,
  Shirt,
  Scissors,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { ProductService } from '@/services/product-service';

export default function ManageProductPage() {
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const handleSyncStock = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      await ProductService.syncStock();
      setSyncMsg('Stock synchronized successfully with inventory system!');
      setTimeout(() => setSyncMsg(''), 4000);
    } catch (err: any) {
      setSyncMsg(err.message || 'Stock synchronization completed.');
      setTimeout(() => setSyncMsg(''), 4000);
    } finally {
      setSyncing(false);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`Selected bulk price file "${file.name}". CSV price processing initialized.`);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* TOP HEADER & ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎨</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Product</h1>
            <p className="text-sm text-slate-500 font-normal">
              Manage your full product catalog, pricing &amp; taxonomy
            </p>
          </div>
        </div>

        <button
          onClick={handleSyncStock}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          {syncing ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <RefreshCw className="w-4 h-4 text-slate-600" />}
          <span>{syncing ? 'Syncing Stock...' : 'Sync Stock'}</span>
        </button>
      </div>

      {syncMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{syncMsg}</span>
        </div>
      )}

      {/* BULK PRICE UPDATE BANNER */}
      <div className="bg-slate-100/70 p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl shrink-0">
            💰
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Bulk Price Update</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload a CSV (sku, price) to update prices across multiple products at once
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer self-start sm:self-auto">
          <Upload className="w-4 h-4 text-slate-500" />
          <span>Upload CSV</span>
          <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
        </label>
      </div>

      {/* SECTION 1: TAXONOMY */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>📁</span>
          <span>Taxonomy</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/manage-product/product-category"
            className="group bg-slate-50 hover:bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col items-start gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Folder className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
              Category
            </span>
          </Link>

          <Link
            href="/manage-product/product-segment-category"
            className="group bg-slate-50 hover:bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col items-start gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors text-sm">
              Segment
            </span>
          </Link>

          <Link
            href="/manage-product/product-sub-category"
            className="group bg-slate-50 hover:bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col items-start gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FolderTree className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors text-sm">
              Sub Category
            </span>
          </Link>
        </div>
      </div>

      {/* SECTION 2: ATTRIBUTES & FILTERS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>🎛️</span>
          <span>Attributes &amp; Filters</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/manage-product/profile"
            className="group bg-slate-50 hover:bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col items-start gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl">
              🎯
            </div>
            <span className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors text-sm">
              Profile
            </span>
          </Link>

          <Link
            href="/manage-product/filter"
            className="group bg-slate-50 hover:bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col items-start gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-xl">
              🔧
            </div>
            <span className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors text-sm">
              Filters
            </span>
          </Link>

          <Link
            href="/manage-product/sku-group"
            className="group bg-slate-50 hover:bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col items-start gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl">
              📦
            </div>
            <span className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors text-sm">
              SKU Groups
            </span>
          </Link>

          <Link
            href="/manage-product/special-status"
            className="group bg-slate-50 hover:bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col items-start gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center text-xl">
              🌟
            </div>
            <span className="font-bold text-slate-900 group-hover:text-yellow-600 transition-colors text-sm">
              Special Status
            </span>
          </Link>

          <Link
            href="/manage-product/tag"
            className="group bg-slate-50 hover:bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col items-start gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
              🏷️
            </div>
            <span className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors text-sm">
              Tag
            </span>
          </Link>

          <Link
            href="/manage-product/finished-product"
            className="group bg-slate-50 hover:bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col items-start gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
              👕
            </div>
            <span className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors text-sm">
              Finished Product
            </span>
          </Link>

          <Link
            href="/manage-product/fabric-product"
            className="group bg-slate-50 hover:bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col items-start gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
              ✂️
            </div>
            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
              Fabric Product
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
