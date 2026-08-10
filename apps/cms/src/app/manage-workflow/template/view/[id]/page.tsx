'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageHeading } from '@/components/ui/PageHeading';
import { ArrowLeft } from 'lucide-react';

export default function ViewWorkflowTemplatePage() {
  const params = useParams();
  const id = params?.id ? String(params.id) : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/manage-workflow/template" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeading heading={`View Template: ${id}`} />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 text-lg mb-2">Process Sequence Details</h3>
        <p className="text-sm text-slate-600">
          1. Yarn Sourcing & Inspection → 2. Natural Dyeing → 3. Warp Preparation → 4. Loom Weaving → 5. Quality Audit → 6. Finishing & Packaging.
        </p>
      </div>
    </div>
  );
}
