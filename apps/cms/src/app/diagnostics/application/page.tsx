'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import { ArrowLeft, Cpu } from 'lucide-react';

export default function ApplicationDiagnosticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/diagnostics" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeading heading="Application Diagnostics" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-base">Application Runtime Telemetry</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 uppercase">Uptime</p>
            <p className="text-xl font-bold text-slate-900 mt-1">14 days, 6 hours</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 uppercase">Heap Memory Used</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">482 MB / 2,048 MB</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 uppercase">Active DB Connections</p>
            <p className="text-xl font-bold text-indigo-600 mt-1">12 active pools</p>
          </div>
        </div>
      </div>
    </div>
  );
}
