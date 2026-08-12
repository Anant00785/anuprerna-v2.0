'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import { ArrowLeft } from 'lucide-react';

export default function HostDiagnosticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/diagnostics" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeading heading="Host Infrastructure Diagnostics" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 text-base mb-2">Host Node Health</h3>
        <p className="text-sm text-slate-600">
          Server OS: Linux 6.1 x86_64 · Load Average: 0.24, 0.18, 0.15 · Disk Usage: 34.2 GB / 100 GB.
        </p>
      </div>
    </div>
  );
}
