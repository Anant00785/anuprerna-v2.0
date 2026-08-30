'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Newspaper } from 'lucide-react';

export default function ManageContentPage() {
  return (
    <div className="space-y-8 pt-2 pb-16">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 via-sky-400 to-indigo-500 p-0.5 shadow-xs flex items-center justify-center">
          <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-lg">
            📚
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1f2438] tracking-tight">Content Studio</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Curate stories and blogs that bring the craft to life
          </p>
        </div>
      </div>

      {/* 2-CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* CARD 1: MANAGE STORY */}
        <div className="bg-[#f0f4f9] rounded-2xl p-8 border border-slate-200/60 shadow-xs flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-100/80 text-sky-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>

            <h2 className="text-xl font-bold text-[#1f2438] mt-4">Manage Story</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Long-form narratives about artisans, processes, and the cultural roots of our craft.
            </p>

            {/* Quick Link Badges */}
            <div className="flex items-center gap-2.5 mt-5 flex-wrap">
              <Link
                href="/manage-content/story/category"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
              >
                <span>📁</span>
                <span>Categories</span>
              </Link>
              <Link
                href="/manage-content/story"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
              >
                <span>✍️</span>
                <span>Content</span>
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/manage-content/story"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1f2438] hover:underline"
            >
              <span>Open Story Studio</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* CARD 2: MANAGE BLOG */}
        <div className="bg-[#f0f7f4] rounded-2xl p-8 border border-slate-200/60 shadow-xs flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center">
              <Newspaper className="w-5 h-5" />
            </div>

            <h2 className="text-xl font-bold text-[#1f2438] mt-4">Manage Blog</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Editorial articles, journal entries, and seasonal updates for the public-facing site.
            </p>

            {/* Quick Link Badges */}
            <div className="flex items-center gap-2.5 mt-5 flex-wrap">
              <Link
                href="/manage-content/blog/type"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
              >
                <span>🏷️</span>
                <span>Types</span>
              </Link>
              <Link
                href="/manage-content/blog/category"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
              >
                <span>📁</span>
                <span>Categories</span>
              </Link>
              <Link
                href="/manage-content/blog"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
              >
                <span>📄</span>
                <span>Content</span>
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/manage-content/blog"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1f2438] hover:underline"
            >
              <span>Open Blog Studio</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

