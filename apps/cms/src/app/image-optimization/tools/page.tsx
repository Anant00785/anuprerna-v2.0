'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import { ArrowLeft, Wrench } from 'lucide-react';

export default function OptimizationToolsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/image-optimization" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeading heading="Squish Studio Tools" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center gap-3">
          <Wrench className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-base">Bulk Image Utilities</h3>
        </div>
        <p className="text-sm text-slate-600">
          Manual triggers for bulk webp conversion, swatch image generation, watermarking, and thumbnail regeneration.
        </p>
      </div>
    </div>
  );
}
