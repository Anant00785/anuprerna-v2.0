'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import { ArrowLeft } from 'lucide-react';

export default function OptimizationHistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/image-optimization" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeading heading="Optimization History" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <p className="text-sm text-slate-600">
          History log of 1,240 images compressed with average 68% size reduction.
        </p>
      </div>
    </div>
  );
}
