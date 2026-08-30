'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';
import {
  Loader2,
  Plus,
  Eye,
  Clock,
  UserCheck,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface CustomWorkflowItem {
  id: number;
  name: string;
  description?: string;
  workflowType?: string;
  orderId?: number;
  orderCreatedAt?: number;
  orderDeliveryDateFrom?: number;
  orderDeliveryDateTo?: number;
  productSku?: string;
  productName?: string;
  productImage?: string;
  status?: string;
}

export default function ManageCustomProcessPage() {
  const [activeTab, setActiveTab] = useState<'INITIATED' | 'CREATED' | 'COMPLETED'>('INITIATED');
  const [items, setItems] = useState<CustomWorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Image Preview Lightbox Modal
  const [previewItem, setPreviewItem] = useState<CustomWorkflowItem | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const response = await apiClient.get(`/get/custom-workflow-list/${activeTab}`);
        const data = unwrapResponseData<CustomWorkflowItem[]>(response.data, 'workflowList') || [];
        setItems(data);
        setCurrentPage(1);
      } catch (err: any) {
        setError(err.message || `Failed to fetch ${activeTab.toLowerCase()} custom workflow processes.`);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeTab]);

  const formatDate = (timestamp?: number) => {
    if (timestamp === undefined || timestamp === null) return '-';
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  const totalPages = Math.ceil(items.length / pageSize) || 1;
  const paginatedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 pt-2 pb-20 max-w-7xl mx-auto">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/manage-workflow" className="hover:text-slate-900">
          Manage Workflow
        </Link>
        <span>/</span>
        <span className="bg-[#1f2438] text-white px-2.5 py-0.5 rounded-full font-bold text-[10px]">
          Custom Process
        </span>
      </div>

      {/* PAGE TITLE */}
      <h1 className="text-xl font-bold text-[#1f2438] tracking-tight">
        MANAGE CUSTOM PROCESS
      </h1>

      {/* TOTAL COUNT PURPLE BANNER */}
      <div className="bg-[#585c82] text-white px-5 py-3 rounded-lg flex items-center justify-between shadow-xs">
        <span className="text-xs font-bold uppercase tracking-wider">
          TOTAL COUNT ({items.length.toString().padStart(2, '0')})
        </span>
        <Link
          href="/manage-workflow/template"
          className="w-6 h-6 rounded-full border border-white/80 flex items-center justify-center hover:bg-white/20 transition-colors"
          title="Create Custom Workflow Process"
        >
          <Plus className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* TABS (INITIATED / CREATED / COMPLETED) */}
      <div className="flex items-center justify-center gap-8 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider pt-2 pb-0.5">
        <button
          type="button"
          onClick={() => setActiveTab('INITIATED')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'INITIATED'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          INITIATED
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('CREATED')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'CREATED'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          CREATED
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('COMPLETED')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'COMPLETED'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          COMPLETED
        </button>
      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* PROCESS TABLE */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-[#585c82] animate-spin" />
            <p className="text-xs text-slate-500 font-medium">
              Loading {activeTab.toLowerCase()} custom processes...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-16">
            No {activeTab.toLowerCase()} custom workflow processes found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                  <th className="px-5 py-3.5 whitespace-nowrap">Order #</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Order Date</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Est. Delivery (From)</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Est. Delivery (To)</th>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5 min-w-[280px]">Associated Product</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedItems.map((item, idx) => {
                  const hasImage = Boolean(item.productImage);
                  const isPending = activeTab === 'INITIATED';

                  return (
                    <tr
                      key={item.id || idx}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Order # with Clock & Assigned Badge */}
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-800">
                        <div className="flex items-center gap-2">
                          <span>{item.orderId || item.id}</span>
                          {isPending && (
                            <span title="Pending">
                              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0369a1] bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200/60">
                            <UserCheck className="w-3 h-3" />
                            Assigned
                          </span>
                        </div>
                      </td>

                      {/* Order Date */}
                      <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                        {formatDate(item.orderCreatedAt)}
                      </td>

                      {/* Est. Delivery From */}
                      <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                        {formatDate(item.orderDeliveryDateFrom)}
                      </td>

                      {/* Est. Delivery To */}
                      <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                        {formatDate(item.orderDeliveryDateTo)}
                      </td>

                      {/* Name */}
                      <td className="px-5 py-4 font-medium text-slate-800 max-w-xs">
                        <span className="line-clamp-2" title={item.name}>
                          {item.name || '-'}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="px-5 py-4 text-slate-600 max-w-xs">
                        <span className="line-clamp-2" title={item.description}>
                          {item.description || '-'}
                        </span>
                      </td>

                      {/* Associated Product */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {hasImage ? (
                            <div
                              onClick={() => setPreviewItem(item)}
                              className="relative w-12 h-10 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer group shadow-2xs"
                            >
                              <img
                                src={item.productImage}
                                alt={item.productName || 'Product'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-10 rounded-md bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-[10px] text-slate-400 font-semibold">
                              N/A
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-xs line-clamp-2 leading-tight">
                              {item.productName || item.productSku || '-'}
                            </p>
                            {item.productSku && item.productSku !== item.productName && (
                              <p className="text-[11px] text-slate-400 truncate">
                                ({item.productSku})
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setPreviewItem(item)}
                          className="p-1.5 text-slate-600 hover:text-[#585c82] hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {!loading && items.length > pageSize && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold">
                {Math.min(currentPage * pageSize, items.length)}
              </span>{' '}
              of <span className="font-semibold">{items.length}</span> processes
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-1.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-3 py-1 font-semibold text-[#1f2438]">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL / IMAGE PREVIEW MODAL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-lg w-full space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Custom Process Details
                </span>
                <h3 className="text-sm font-bold text-[#1f2438]">
                  Order #{previewItem.orderId || previewItem.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Image */}
            {previewItem.productImage ? (
              <div className="relative w-full h-56 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={previewItem.productImage}
                  alt={previewItem.productName || 'Product'}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-full h-32 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400 font-medium">
                No product image available
              </div>
            )}

            {/* Product Info */}
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Product Name
                </span>
                <p className="font-bold text-slate-800">
                  {previewItem.productName || previewItem.productSku || '-'}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Workflow Name
                </span>
                <p className="text-slate-700">{previewItem.name || '-'}</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Description
                </span>
                <p className="text-slate-700">{previewItem.description || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    Order Date
                  </span>
                  <p className="font-semibold text-slate-700">
                    {formatDate(previewItem.orderCreatedAt)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    Est. Delivery
                  </span>
                  <p className="font-semibold text-slate-700">
                    {formatDate(previewItem.orderDeliveryDateFrom)} -{' '}
                    {formatDate(previewItem.orderDeliveryDateTo)}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#585c82] hover:bg-[#484c70] rounded-lg shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

