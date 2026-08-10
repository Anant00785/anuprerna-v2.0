'use client';

import React from 'react';
import { PageHeading } from '@/components/ui/PageHeading';
import { Plus, Sliders } from 'lucide-react';

export default function CustomProductPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeading heading="Custom Products & Made-to-Order" />
        <button className="wv-btn flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>New Custom Config</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center gap-3">
          <Sliders className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-base">Customization Rule Engine</h3>
        </div>
        <p className="text-sm text-slate-600">
          Configure custom dimensions, weave specifications, artisan assignments, and volume pricing matrix for bespoke client requests.
        </p>
      </div>
    </div>
  );
}
