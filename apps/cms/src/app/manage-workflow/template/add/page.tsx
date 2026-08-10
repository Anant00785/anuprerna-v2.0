'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import { ArrowLeft, Save } from 'lucide-react';

export default function AddWorkflowTemplatePage() {
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/manage-workflow/template" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeading heading="Add Workflow Template" />
      </div>

      <form className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
        <div className="space-y-2">
          <label className="wv-input-label">Template Name *</label>
          <input
            type="text"
            required
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g. Handloom Khadi Dyeing & Weaving"
            className="wv-input"
          />
        </div>

        <div className="space-y-2">
          <label className="wv-input-label">Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of process stages..."
            className="wv-input"
          />
        </div>

        <button type="submit" className="wv-btn flex items-center gap-2">
          <Save className="w-4 h-4" />
          <span>Save Workflow Template</span>
        </button>
      </form>
    </div>
  );
}
