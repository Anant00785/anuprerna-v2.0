'use client';

import React from 'react';
import { PageHeading } from '@/components/ui/PageHeading';

export default function CustomProcessPage() {
  return (
    <div className="space-y-6">
      <PageHeading heading="Custom Order Processes" />
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <p className="text-sm text-slate-600">
          Track production stages for bespoke client custom weaving requests.
        </p>
      </div>
    </div>
  );
}
