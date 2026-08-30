'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronUp,
  ChevronDown,
  Loader2,
  CheckCircle2,
  XCircle,
  Bell,
  ArrowUpRight,
} from 'lucide-react';

interface FeedbackItem {
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

const INITIAL_FEEDBACK: FeedbackItem[] = [
  {
    id: 'FB-101',
    userName: 'Urvashi Lamba',
    orderNumber: '175378578',
    orderDate: '28 Aug 2026',
    estDeliveryFrom: '01 Sep 2026',
    estDeliveryTo: '02 Sep 2026',
    sku: 'SwatchKit-OrganicKhadiCotton',
    step: 'Washing',
    subProcess: 'QC Fabric',
    description: "QC Completion & Approval | Ignore if there's variance for digital images",
    images: [],
    videos: [],
    status: 'Pending',
  },
  {
    id: 'FB-102',
    userName: 'Urvashi Lamba',
    orderNumber: '175378578',
    orderDate: '28 Aug 2026',
    estDeliveryFrom: '01 Sep 2026',
    estDeliveryTo: '02 Sep 2026',
    sku: 'Jamdani Fabric Swatchkit',
    step: 'Washing',
    subProcess: 'QC Fabric',
    description: "QC Completion & Approval | Checked color consistency and selvage tension",
    images: [],
    videos: [],
    status: 'Pending',
  },
  {
    id: 'FB-103',
    userName: 'Urvashi Lamba',
    orderNumber: '175378578',
    orderDate: '28 Aug 2026',
    estDeliveryFrom: '01 Sep 2026',
    estDeliveryTo: '02 Sep 2026',
    sku: 'Mulberry Silk Fabric Swatch',
    step: 'Washing',
    subProcess: 'QC Fabric',
    description: "QC Completion & Approval | Soft washed finish and ply inspection complete",
    images: [],
    videos: [],
    status: 'Pending',
  },
  {
    id: 'FB-104',
    userName: 'Urvashi Lamba',
    orderNumber: '175378578',
    orderDate: '28 Aug 2026',
    estDeliveryFrom: '01 Sep 2026',
    estDeliveryTo: '02 Sep 2026',
    sku: 'Swatch Kit - HEMP, BANANA, LYOCELL & BAMBOO',
    step: 'Washing',
    subProcess: 'QC Fabric',
    description: "QC Completion & Approval | Natural plant fibre texture verification",
    images: [],
    videos: [],
    status: 'Pending',
  },
  {
    id: 'FB-105',
    userName: 'Nirav dholaria',
    orderNumber: '176251671',
    orderDate: '29 Aug 2026',
    estDeliveryFrom: '03 Sep 2026',
    estDeliveryTo: '05 Sep 2026',
    sku: 'DML1200495',
    step: 'Washing',
    subProcess: 'QC Fabric',
    description: "QC Completion & Approval | Double checked hand-spinning count and grain",
    images: [],
    videos: [],
    status: 'Pending',
  },
];

export default function WorkflowFeedbackPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>(INITIAL_FEEDBACK);
  const [expandedRowId, setExpandedRowId] = useState<string | null>('FB-101');
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [actionSuccess, setActionSuccess] = useState('');

  const toggleRow = (id: string) => {
    setExpandedRowId(prev => (prev === id ? null : id));
  };

  const handleAction = (id: string, newStatus: 'Approved' | 'Rejected', notify: boolean = false) => {
    const remark = remarksMap[id] || '';
    setFeedbackList(prev =>
      prev.map(item => (item.id === id ? { ...item, status: newStatus, remarks: remark } : item))
    );
    setActionSuccess(
      `Feedback ${id} marked as ${newStatus}${notify ? ' and notification sent to artisan & customer!' : '!'}`
    );
    setTimeout(() => setActionSuccess(''), 4000);
  };

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
          Feedback
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

      {/* ACTION SUCCESS MESSAGE */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* FEEDBACK TABLE CARD */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-16">
            No {activeTab.toLowerCase()} feedback items found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                  <th className="px-5 py-3.5 whitespace-nowrap">User Name</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Order #</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Order Date</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Est. Delivery (From)</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Est. Deliverys (To)</th>
                  <th className="px-5 py-3.5">SKU</th>
                  <th className="px-4 py-3.5">Step</th>
                  <th className="px-4 py-3.5">Sub Process</th>
                  <th className="px-4 py-3.5 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredItems.map(item => {
                  const isExpanded = expandedRowId === item.id;

                  return (
                    <React.Fragment key={item.id}>
                      {/* MAIN ROW */}
                      <tr
                        onClick={() => toggleRow(item.id)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded ? 'bg-slate-50/70' : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-800">
                          {item.userName}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-slate-700 font-mono">
                          {item.orderNumber}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                          {item.orderDate}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                          {item.estDeliveryFrom}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                          {item.estDeliveryTo}
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-800 max-w-xs">
                          <span className="line-clamp-2" title={item.sku}>
                            {item.sku}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-slate-700">
                          {item.step}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-slate-700">
                          {item.subProcess}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              toggleRow(item.id);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* EXPANDED ACCORDION DETAILS ROW - MATCHING SCREENSHOT */}
                      {isExpanded && (
                        <tr className="bg-white">
                          <td colSpan={9} className="p-6 border-t border-b border-slate-100">
                            <div className="space-y-4 max-w-5xl">
                              {/* TOP RIGHT REDIRECT BUTTON */}
                              <div className="flex justify-end">
                                <Link
                                  href="/manage-workflow/process"
                                  className="px-4 py-1.5 bg-[#585c82] hover:bg-[#484c70] text-white text-xs font-semibold rounded-md shadow-xs transition-colors inline-flex items-center gap-1.5"
                                >
                                  Redirect to Workflow
                                </Link>
                              </div>

                              {/* DESCRIPTION & MEDIA INFO */}
                              <div className="space-y-2 text-xs text-slate-700">
                                <p>
                                  <span className="font-semibold text-slate-900">
                                    Description:
                                  </span>{' '}
                                  {item.description}
                                </p>
                                <p>
                                  <span className="font-semibold text-slate-900">
                                    Images:
                                  </span>{' '}
                                  {item.images.length > 0
                                    ? item.images.join(', ')
                                    : 'N/A'}
                                </p>
                                <p>
                                  <span className="font-semibold text-slate-900">
                                    Videos:
                                  </span>{' '}
                                  {item.videos.length > 0
                                    ? item.videos.join(', ')
                                    : 'N/A'}
                                </p>
                              </div>

                              {/* REMARKS TEXTAREA */}
                              <div>
                                <textarea
                                  rows={4}
                                  value={remarksMap[item.id] || ''}
                                  onChange={e =>
                                    setRemarksMap({ ...remarksMap, [item.id]: e.target.value })
                                  }
                                  placeholder="Enter your remarks (optional)"
                                  className="w-full p-3.5 text-xs text-slate-800 border border-slate-300 rounded-md outline-none focus:border-[#585c82] bg-white resize-y"
                                />
                              </div>

                              {/* ACTION BUTTONS (REJECT, APPROVE, APPROVE & NOTIFY) */}
                              <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                  type="button"
                                  onClick={() => handleAction(item.id, 'Rejected')}
                                  className="px-4 py-1.5 bg-[#585c82] hover:bg-slate-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAction(item.id, 'Approved', false)}
                                  className="px-4 py-1.5 bg-[#585c82] hover:bg-[#484c70] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAction(item.id, 'Approved', true)}
                                  className="px-4 py-1.5 bg-[#585c82] hover:bg-[#484c70] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                                >
                                  Approve & Notify
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

