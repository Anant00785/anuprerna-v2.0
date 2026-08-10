'use client';

import React from 'react';
import { PageHeading } from '@/components/ui/PageHeading';
import { Settings } from 'lucide-react';

export default function StandardProcessPage() {
  const processes = [
    { id: 'PROC-101', name: 'Kala Cotton Batch #44', artisan: 'Biren Das', stage: 'Stage 3/6 (Warping)', progress: '50%' },
    { id: 'PROC-102', name: 'Jamdani Silk Batch #12', artisan: 'Parul Begum', stage: 'Stage 5/8 (Weaving)', progress: '70%' },
  ];

  return (
    <div className="space-y-6">
      <PageHeading heading="Standard Production Processes" />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Process ID</th>
              <th className="px-6 py-4">Batch Name</th>
              <th className="px-6 py-4">Assigned Artisan</th>
              <th className="px-6 py-4">Current Stage</th>
              <th className="px-6 py-4">Completion</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {processes.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{p.id}</td>
                <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                <td className="px-6 py-4 text-slate-700">{p.artisan}</td>
                <td className="px-6 py-4 text-slate-600 font-medium">{p.stage}</td>
                <td className="px-6 py-4 font-semibold text-emerald-700">{p.progress}</td>
                <td className="px-6 py-4 text-right">
                  <button className="btn-transparent flex items-center gap-1.5 ml-auto">
                    <Settings className="w-4 h-4" /> Track
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
