'use client';

import React from 'react';
import { PageHeading } from '@/components/ui/PageHeading';

export default function CustomWorkflowFeedbackPage() {
  return (
    <div className="space-y-6">
      <PageHeading heading="Custom Order Production Feedback" />
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <p className="text-sm text-slate-600">
          Review artisan notes for custom bespoke order weaving stages.
        </p>
      </div>
    </div>
  );
}
