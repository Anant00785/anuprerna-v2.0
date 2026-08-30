'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface CustomFeedbackItem {
  id: string;
  userName: string;
  orderNumber: string;
  orderDate: string;
  estDeliveryFrom: string;
  estDeliveryTo: string;
  sku: string;
  step: string;
  subProcess: string;
  description: string;
  images: string[];
  videos: string[];
  status: 'Pending' | 'Approved' | 'Rejected';
  remarks?: string;
}

export default function CustomWorkflowFeedbackPage() {
  const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [feedbackList] = useState<CustomFeedbackItem[]>([]);

  const filteredItems = feedbackList.filter(item => item.status === activeTab);

  return (
    <div className="space-y-6 pt-2 pb-20 max-w-7xl mx-auto">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/manage-workflow" className="hover:text-slate-900">
          Manage Workflow
        </Link>
        <span>/</span>
        <span className="bg-[#1f2438] text-white px-2.5 py-0.5 rounded-full font-bold text-[10px]">
          Custom Feedback
        </span>
      </div>

      {/* TABS (Pending / Approved / Rejected) - EXACT POSITIONING */}
      <div className="flex items-center justify-center gap-8 border-b border-slate-200 text-xs font-semibold pt-2 pb-0.5">
        <button
          type="button"
          onClick={() => setActiveTab('Pending')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'Pending'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Pending
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Approved')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'Approved'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Approved
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Rejected')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'Rejected'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Rejected
        </button>
      </div>

      {/* EMPTY STATE - EXACT MATCH WITH SCREENSHOT */}
      <div className="flex items-center justify-center pt-8">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          No workflow feedbacks available!
        </h2>
      </div>
    </div>
  );
}

