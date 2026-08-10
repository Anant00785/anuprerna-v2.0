'use client';

import React from 'react';
import { PageHeading } from '@/components/ui/PageHeading';

export default function WorkflowFeedbackPage() {
  return (
    <div className="space-y-6">
      <PageHeading heading="Workflow Step Feedback" />
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <p className="text-sm text-slate-600">
          Review artisan notes, yarn quality checkpoints, and production stage feedback logs.
        </p>
      </div>
    </div>
  );
}
