'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageHeading } from '@/components/ui/PageHeading';
import { ArrowLeft, Save } from 'lucide-react';

export default function UpdateWorkflowTemplatePage() {
  const params = useParams();
  const id = params?.id ? String(params.id) : '';

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/manage-workflow/template" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeading heading={`Update Template: ${id}`} />
      </div>

      <form className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
        <div className="space-y-2">
          <label className="wv-input-label">Template Title</label>
          <input
            type="text"
            defaultValue="Standard Handloom Cotton Weaving Process"
            className="wv-input"
          />
        </div>

        <button type="submit" className="wv-btn flex items-center gap-2">
          <Save className="w-4 h-4" />
          <span>Update Template</span>
        </button>
      </form>
    </div>
  );
}
