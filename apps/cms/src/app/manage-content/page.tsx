'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Newspaper, ArrowRight, Sparkles } from 'lucide-react';

export default function ManageContentPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">📚</span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Content Management Studio</h1>
          <p className="text-sm text-slate-500 font-normal">
            Publish and curate blog articles, artisan stories &amp; content taxonomy
          </p>
        </div>
      </div>

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/manage-content/story"
          className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                Artisan Stories &amp; Tales
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Long-form narratives about artisans, traditional handloom processes, and cultural heritage roots.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-600">
            <span>Manage Stories &amp; Categories</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/manage-content/blog"
          className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Newspaper className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Blog Posts &amp; Journal
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Editorial articles, textile guides, seasonal fashion updates, blog categories, and content types.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
            <span>Manage Blog Articles &amp; Taxonomy</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
