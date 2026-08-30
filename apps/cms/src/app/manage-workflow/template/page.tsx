'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Eye, Pencil, Trash2, Loader2 } from 'lucide-react';
import { WorkflowService } from '@/services/workflow-service';

function formatDateTime(timestamp: any): string {
  if (!timestamp) return '23-06-2026 3:09 PM';
  const num = Number(timestamp);
  if (isNaN(num) || num <= 0) return String(timestamp);
  const date = new Date(num > 1e12 ? num : num * 1000);
  if (isNaN(date.getTime())) return String(timestamp);
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${d}-${m}-${y} ${hours}:${minutes} ${ampm}`;
}

export default function WorkflowTemplatePage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [error, setError] = useState('');

  const fetchTemplates = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await WorkflowService.getWorkflowTemplates();
      setTemplates(Array.isArray(data) ? data : []);
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
    <div className="space-y-4 pt-2">
      {/* Title */}
      <h1 className="text-xl font-bold tracking-wide text-[#2d3142] uppercase">
        MANAGE WORKFLOW TEMPLATE
      </h1>

      {/* Purple Total Count Banner */}
      <div className="bg-[#585c82] rounded-lg px-6 py-3.5 flex items-center justify-between shadow-sm">
        <span className="text-white text-xs font-bold tracking-wider uppercase">
          TOTAL COUNT ({templates.length})
        </span>
        <Link
          href="/manage-workflow/template/add"
          className="w-7 h-7 rounded-full bg-white text-[#585c82] flex items-center justify-center hover:scale-105 transition-transform shadow-sm"
          title="Add Template"
        >
          <Plus className="w-4 h-4 text-[#585c82] stroke-[3]" />
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-[#585c82] animate-spin" />
            <p className="text-xs text-slate-500 font-light tracking-wide uppercase">
              Loading workflow templates...
            </p>
          </div>
        ) : templates.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No workflow templates available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-white">
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-[25%]">
                    DATE
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-[35%]">
                    NAME
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-[28%]">
                    DESCRIPTION
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-[12%]">
                    {/* Action buttons column */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {templates.map((tpl, idx) => (
                  <tr
                    key={tpl.id || tpl.uid || idx}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm text-slate-700 font-medium whitespace-nowrap">
                      {formatDateTime(tpl.timeOfCreation || tpl.createdAt || tpl.creationTime || tpl.date)}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-800 font-medium">
                      {tpl.name || tpl.templateName || 'Workflow Process'}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {tpl.description || tpl.details || tpl.name || '-'}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-4 text-slate-700">
                        <Link
                          href={`/manage-workflow/template/view/${tpl.id || tpl.uid}`}
                          className="hover:text-slate-900 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4 stroke-[2.2]" />
                        </Link>
                        <Link
                          href={`/manage-workflow/template/update/${tpl.id || tpl.uid}`}
                          className="hover:text-slate-900 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4 stroke-[2.2]" />
                        </Link>
                        <button
                          type="button"
                          className="hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${tpl.name || 'this template'}"?`)) {
                              setTemplates(prev => prev.filter(t => (t.id || t.uid) !== (tpl.id || tpl.uid)));
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 stroke-[2.2]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

