'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Upload } from 'lucide-react';

export default function ManageProductPage() {
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`Selected bulk price file "${file.name}". CSV price processing initialized.`);
    }
  };

  return (
    <div className="space-y-8 pt-2 pb-16">
      {/* BULK PRICE UPDATE BANNER */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-2xl shrink-0">
            💰
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Bulk Price Update</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload a CSV (sku, price) to update prices across multiple products at once
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer self-start sm:self-auto">
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          <span>Upload CSV</span>
          <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
        </label>
      </div>

      {/* SECTION 1: TAXONOMY */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <span>📁</span>
          <span>TAXONOMY</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link
            href="/manage-product/category"
            className="bg-[#fffbf0] hover:bg-[#fff7e0] p-6 rounded-2xl border border-amber-100/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-32"
          >
            <div className="text-2xl">📁</div>
            <span className="font-bold text-slate-900 text-sm">Category</span>
          </Link>

          <Link
            href="/manage-product/segment"
            className="bg-[#fffbf0] hover:bg-[#fff7e0] p-6 rounded-2xl border border-amber-100/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-32"
          >
            <div className="text-2xl">📑</div>
            <span className="font-bold text-slate-900 text-sm">Segment</span>
          </Link>

          <Link
            href="/manage-product/sub-category"
            className="bg-[#fffbf0] hover:bg-[#fff7e0] p-6 rounded-2xl border border-amber-100/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-32"
          >
            <div className="text-2xl">📂</div>
            <span className="font-bold text-slate-900 text-sm">Sub Category</span>
          </Link>
        </div>
      </div>

      {/* SECTION 2: ATTRIBUTES & FILTERS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <span>🎛️</span>
          <span>ATTRIBUTES &amp; FILTERS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <Link
            href="/manage-product/profile"
            className="bg-[#f0f7f4] hover:bg-[#e6f4ed] p-6 rounded-2xl border border-slate-200/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-32"
          >
            <div className="text-2xl">🎯</div>
            <span className="font-bold text-slate-900 text-sm">Profile</span>
          </Link>

          <Link
            href="/manage-product/filters"
            className="bg-[#f0f7f4] hover:bg-[#e6f4ed] p-6 rounded-2xl border border-slate-200/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-32"
          >
            <div className="text-2xl">🔧</div>
            <span className="font-bold text-slate-900 text-sm">Filters</span>
          </Link>

          <Link
            href="/manage-product/sku-group"
            className="bg-[#f0f7f4] hover:bg-[#e6f4ed] p-6 rounded-2xl border border-slate-200/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-32"
          >
            <div className="text-2xl">📦</div>
            <span className="font-bold text-slate-900 text-sm">SKU Groups</span>
          </Link>

          <Link
            href="/manage-product/special-status"
            className="bg-[#f0f7f4] hover:bg-[#e6f4ed] p-6 rounded-2xl border border-slate-200/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-32"
          >
            <div className="text-2xl">🌟</div>
            <span className="font-bold text-slate-900 text-sm">Special Status</span>
          </Link>

          <Link
            href="/manage-product/tag"
            className="bg-[#f0f7f4] hover:bg-[#e6f4ed] p-6 rounded-2xl border border-slate-200/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-32"
          >
            <div className="text-2xl">🏷️</div>
            <span className="font-bold text-slate-900 text-sm">Tag</span>
          </Link>
        </div>
      </div>

      {/* SECTION 3: PRODUCTS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <span>📦</span>
          <span>PRODUCTS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link
            href="/manage-product/finished-product"
            className="bg-[#f0f4f9] hover:bg-[#e6edf7] p-6 rounded-2xl border border-slate-200/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-32"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
              ✓
            </div>
            <span className="font-bold text-slate-900 text-sm">Finished Product</span>
          </Link>

          <Link
            href="/manage-product/fabric-product"
            className="bg-[#f0f4f9] hover:bg-[#e6edf7] p-6 rounded-2xl border border-slate-200/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-32"
          >
            <div className="text-2xl text-sky-600">🪡</div>
            <span className="font-bold text-slate-900 text-sm">Fabric Product</span>
          </Link>

          <Link
            href="/manage-product/custom-product"
            className="bg-[#f0f4f9] hover:bg-[#e6edf7] p-6 rounded-2xl border border-slate-200/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-32"
          >
            <div className="text-2xl">📝</div>
            <span className="font-bold text-slate-900 text-sm">Custom Product</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

