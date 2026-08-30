'use client';

import React from 'react';
import Link from 'next/link';

export default function FilterStudioPage() {
  return (
    <div className="space-y-6 pt-2 pb-16">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="text-3xl">
          🔎
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1f2438] tracking-tight">Filter Studio</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Storefront filter dimensions — the facets buyers can use to narrow the catalog on listing pages
          </p>
        </div>
      </div>

      {/* 3 CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: COLOR */}
        <div className="bg-[#fff8f0] p-6 rounded-2xl border border-amber-100/70 shadow-xs flex flex-col justify-between min-h-[175px]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🎨</span>
            </div>
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
              COLOR PALETTE
            </span>
            <h3 className="font-bold text-slate-900 text-sm mt-1">Color</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              The color swatches buyers can filter by — names, hex codes, and the order they appear on the storefront.
            </p>
          </div>

          <Link
            href="/manage-product/filter/color"
            className="text-xs font-semibold text-[#585c82] hover:text-[#484c70] inline-flex items-center gap-1 mt-4 transition-colors"
          >
            <span>Open Color</span>
            <span>→</span>
          </Link>
        </div>

        {/* CARD 2: MATERIAL */}
        <div className="bg-[#f0f7f4] p-6 rounded-2xl border border-emerald-100/70 shadow-xs flex flex-col justify-between min-h-[175px]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🧵</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              MATERIAL
            </span>
            <h3 className="font-bold text-slate-900 text-sm mt-1">Material</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Material values assigned to fabrics — fibres, blends, and how each material reads on a listing page.
            </p>
          </div>

          <Link
            href="/manage-product/filter/material"
            className="text-xs font-semibold text-[#585c82] hover:text-[#484c70] inline-flex items-center gap-1 mt-4 transition-colors"
          >
            <span>Open Material</span>
            <span>→</span>
          </Link>
        </div>

        {/* CARD 3: PATTERN */}
        <div className="bg-[#f0f4f9] p-6 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between min-h-[175px]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🧬</span>
            </div>
            <span className="text-[10px] font-bold text-[#585c82] uppercase tracking-wider block">
              PATTERN
            </span>
            <h3 className="font-bold text-slate-900 text-sm mt-1">Pattern</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Pattern values like stripes, check, motif — the visual design vocabulary buyers can filter by.
            </p>
          </div>

          <Link
            href="/manage-product/filter/pattern"
            className="text-xs font-semibold text-[#585c82] hover:text-[#484c70] inline-flex items-center gap-1 mt-4 transition-colors"
          >
            <span>Open Pattern</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
