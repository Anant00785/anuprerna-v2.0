'use client';

import React from 'react';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';

export default function BlogStudioPage() {
  return (
    <div className="space-y-8 pt-2 pb-16">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-xs">
          <Newspaper className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1f2438] tracking-tight">Blog Studio</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Editorial articles, journal entries, and seasonal updates for the public-facing site
          </p>
        </div>
      </div>

      {/* 3-CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: BLOG TYPE */}
        <div className="bg-[#f0f4f9] rounded-2xl p-7 border border-slate-200/60 shadow-xs flex flex-col justify-between min-h-[250px]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏷️</span>
              <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                FORMAT
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#1f2438] mt-4">Blog Type</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Classify articles by format or source — editorial, press release, newsletter, or guest post.
            </p>
          </div>

          <div className="mt-6">
            <Link
              href="/manage-content/blog/type"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1f2438] hover:underline"
            >
              <span>Open Types</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* CARD 2: BLOG CATEGORY */}
        <div className="bg-white rounded-2xl p-7 border border-slate-200/60 shadow-xs flex flex-col justify-between min-h-[250px]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📁</span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                TOPIC
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#1f2438] mt-4">Blog Category</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Group articles by subject — sustainability, collections, festivals, or behind-the-loom features.
            </p>
          </div>

          <div className="mt-6">
            <Link
              href="/manage-content/blog/category"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1f2438] hover:underline"
            >
              <span>Open Categories</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* CARD 3: BLOG CONTENT */}
        <div className="bg-[#f0f7f4] rounded-2xl p-7 border border-slate-200/60 shadow-xs flex flex-col justify-between min-h-[250px]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📝</span>
              <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                ARTICLES
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#1f2438] mt-4">Blog Content</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Write, edit, and publish the articles themselves — rich text, cover images, and metadata.
            </p>
          </div>

          <div className="mt-6">
            <Link
              href="/manage-content/blog/content"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1f2438] hover:underline"
            >
              <span>Open Articles</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
