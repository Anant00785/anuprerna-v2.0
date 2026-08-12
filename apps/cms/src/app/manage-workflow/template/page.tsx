'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import { Plus, Eye, Edit, Layers, Loader2, RefreshCw } from 'lucide-react';
import { WorkflowService } from '@/services/workflow-service';

export default function WorkflowTemplatePage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [error, setError] = useState('');

  const fetchTemplates = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await WorkflowService.getWorkflowTemplates();
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workflow templates from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeading heading="Workflow Templates" />
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTemplates}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link href="/manage-workflow/template/add" className="wv-btn flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Add Template</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500 font-light">Loading BPM workflow templates from live backend...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center text-slate-400">
          No workflow templates available.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl, idx) => (
            <div key={tpl.id || tpl.uid || idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{tpl.name || tpl.templateName || 'Workflow Process'}</h3>
                  <p className="text-xs text-slate-500 font-mono">{tpl.id || tpl.uid || `TPL-${idx + 1}`}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between text-sm">
                <span className="text-slate-500">Steps:</span>
                <span className="font-semibold text-slate-800">{(tpl.stepElements?.length) || tpl.steps || 0} steps</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Duration:</span>
                <span className="font-medium text-slate-700">{tpl.estimatedDays || tpl.duration || 14} days</span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Link href={`/manage-workflow/template/view/${tpl.id || tpl.uid}`} className="btn-transparent flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> View
                </Link>
                <Link href={`/manage-workflow/template/update/${tpl.id || tpl.uid}`} className="btn-outline-black flex items-center gap-1">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
