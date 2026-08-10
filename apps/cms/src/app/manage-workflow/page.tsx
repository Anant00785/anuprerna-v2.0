'use client';

import React from 'react';
import { PageHeading } from '@/components/ui/PageHeading';
import { DashboardCard } from '@/components/ui/DashboardCard';

export default function ManageWorkflowPage() {
  return (
    <div className="space-y-6">
      <PageHeading heading="Manage Process Workflows" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard title="Workflow Templates" action="/manage-workflow/template" emoji="📐" subtitle="Manage master production step templates." />
        <DashboardCard title="Add Workflow Template" action="/manage-workflow/template/add" emoji="➕" subtitle="Define new manufacturing steps & checkpoints." />
        <DashboardCard title="Standard Processes" action="/manage-workflow/process" emoji="⚙️" subtitle="Track ongoing active batch production processes." />
        <DashboardCard title="Custom Processes" action="/manage-workflow/custom-process" emoji="🛠️" subtitle="Track custom client order production stages." />
        <DashboardCard title="Artisan Payments" action="/manage-workflow/artisan-payments" emoji="💸" subtitle="Disburse wage payments & track artisan ledger." />
        <DashboardCard title="Workflow Feedback" action="/manage-workflow/feedback" emoji="💬" subtitle="Review artisan feedback during weaving." />
      </div>
    </div>
  );
}
