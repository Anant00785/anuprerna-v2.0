'use client';

import React from 'react';
import { PageHeading } from '@/components/ui/PageHeading';
import { Bot, RefreshCw } from 'lucide-react';

export default function AIEmbeddingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeading heading="AI Embeddings & Vector Index" />
        <button className="wv-btn flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          <span>Re-index Vectors</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-lg">Semantic Search & AI Vector Store</h3>
        </div>
        <p className="text-sm text-slate-600">
          Manage product image vector embeddings, semantic fabric descriptions, and visual similarity search index.
        </p>
      </div>
    </div>
  );
}
