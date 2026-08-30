'use client';

import React, { useEffect, useState } from 'react';
import { WorkflowService } from '@/services/workflow-service';
import { Loader2, Trash2 } from 'lucide-react';

interface ArtisanPaymentRecord {
  id: number;
  artisanId: number;
  artisanName?: string;
  workflowId: number;
  workflowName?: string;
  isCustom?: boolean;
  effectiveQuantity: number;
  rate: number;
  quantityType: string;
  basePayment: number;
  totalIncentive: number;
  totalPayment: number;
  status: string;
  calculatedAt: number;
  approvedAt?: number | null;
}

const ARTISAN_NAMES: Record<number, string> = {
  47913274: 'Sasthi Ranoo',
  103253057: 'Anuprerna Fabric',
};

const WORKFLOW_NAMES: Record<number, { name: string; isCustom: boolean }> = {
  54196624: { name: 'Amit Singha-53539357...', isCustom: true },
  136148209: { name: 'ICE SAGE-118969111-T...', isCustom: false },
  136115709: { name: 'Kitty Van Coesant-1212...', isCustom: false },
};

function formatDate(timestamp: number | null | undefined): string {
  if (!timestamp) return 'N/A';
  const num = Number(timestamp);
  if (isNaN(num) || num <= 0) return 'N/A';
  const date = new Date(num > 1e12 ? num : num * 1000);
  if (isNaN(date.getTime())) return 'N/A';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default function ArtisanPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<ArtisanPaymentRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'records' | 'settings'>('records');
  const [statusFilter, setStatusFilter] = useState('all');
  const [workflowFilter, setWorkflowFilter] = useState('all');
  const [artisanFilter, setArtisanFilter] = useState('all');
  const [editingRates, setEditingRates] = useState<Record<number, number>>({});
  const [error, setError] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await WorkflowService.getArtisanPayments();
      const rawList = Array.isArray(data) ? data : [];
      const enriched: ArtisanPaymentRecord[] = rawList.map((item: any) => {
        const wfInfo = WORKFLOW_NAMES[item.workflowId] || {
          name: `WF-${item.workflowId}`,
          isCustom: false,
        };
        const artName = ARTISAN_NAMES[item.artisanId] || `Artisan #${item.artisanId}`;
        return {
          ...item,
          workflowName: wfInfo.name,
          isCustom: wfInfo.isCustom,
          artisanName: artName,
        };
      });
      setPayments(enriched);
      const rates: Record<number, number> = {};
      enriched.forEach((p) => {
        rates[p.id] = p.rate;
      });
      setEditingRates(rates);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch artisan payment records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRateChange = (id: number, val: number) => {
    setEditingRates((prev) => ({ ...prev, [id]: val }));
  };

  const handleSaveRate = (id: number) => {
    const newRate = editingRates[id];
    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const base = p.effectiveQuantity * newRate;
          return {
            ...p,
            rate: newRate,
            basePayment: base,
            totalPayment: base + (p.totalIncentive || 0),
          };
        }
        return p;
      })
    );
  };

  const handleApprove = (id: number) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'APPROVED', approvedAt: Date.now() } : p))
    );
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to remove this payment record?')) {
      setPayments((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Calculations for summary stats
  const pendingRecords = payments.filter((p) => p.status === 'PENDING');
  const approvedRecords = payments.filter((p) => p.status === 'APPROVED');
  const paidRecords = payments.filter((p) => p.status === 'PAID');

  const pendingTotal = pendingRecords.reduce((acc, p) => acc + (p.totalPayment || 0), 0);
  const approvedTotal = approvedRecords.reduce((acc, p) => acc + (p.totalPayment || 0), 0);
  const paidTotal = paidRecords.reduce((acc, p) => acc + (p.totalPayment || 0), 0);

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (workflowFilter !== 'all' && String(p.workflowId) !== workflowFilter) return false;
    if (artisanFilter !== 'all' && String(p.artisanId) !== artisanFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 pt-2 pb-16">
      {/* Top Header & Summary Stat Cards */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-[#5054f0] uppercase block mb-1">
            MANAGE WORKFLOW
          </span>
          <h1 className="text-2xl font-bold text-[#2d3142] tracking-tight">
            Artisan Payments
          </h1>
        </div>

        {/* 3 Summary Stat Cards */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Pending Card */}
          <div className="bg-white rounded-lg px-5 py-3 shadow-sm border-l-4 border-[#e58a2f] border border-slate-100 min-w-[130px]">
            <span className="text-[11px] text-slate-500 font-medium block">Pending</span>
            <span className="text-base font-bold text-slate-800 block">
              ₹{pendingTotal.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">
              {pendingRecords.length} records
            </span>
          </div>

          {/* Approved Card */}
          <div className="bg-white rounded-lg px-5 py-3 shadow-sm border-l-4 border-[#3cb179] border border-slate-100 min-w-[130px]">
            <span className="text-[11px] text-slate-500 font-medium block">Approved</span>
            <span className="text-base font-bold text-slate-800 block">
              ₹{approvedTotal.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">
              {approvedRecords.length} records
            </span>
          </div>

          {/* Paid Card */}
          <div className="bg-white rounded-lg px-5 py-3 shadow-sm border-l-4 border-[#4f75f2] border border-slate-100 min-w-[130px]">
            <span className="text-[11px] text-slate-500 font-medium block">Paid</span>
            <span className="text-base font-bold text-slate-800 block">
              ₹{paidTotal.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">
              {paidRecords.length} records
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar Card */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="all">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Workflow</label>
          <select
            value={workflowFilter}
            onChange={(e) => setWorkflowFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="all">All workflows</option>
            {Array.from(new Set(payments.map((p) => p.workflowId))).map((wfId) => (
              <option key={wfId} value={String(wfId)}>
                {WORKFLOW_NAMES[wfId]?.name || `Workflow #${wfId}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Artisan</label>
          <select
            value={artisanFilter}
            onChange={(e) => setArtisanFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="all">All artisans</option>
            {Array.from(new Set(payments.map((p) => p.artisanId))).map((artId) => (
              <option key={artId} value={String(artId)}>
                {ARTISAN_NAMES[artId] || `Artisan #${artId}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('records')}
          className={`pb-2.5 transition-all ${
            activeTab === 'records'
              ? 'border-b-2 border-slate-900 text-slate-900'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          Payment Records
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-2.5 transition-all ${
            activeTab === 'settings'
              ? 'border-b-2 border-slate-900 text-slate-900'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          Settings
        </button>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Tab 1: Payment Records Table */}
      {activeTab === 'records' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 text-[#585c82] animate-spin" />
              <p className="text-xs text-slate-500 font-light tracking-wide uppercase">
                Loading artisan payments...
              </p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No payment records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-white text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-4 px-5">Workflow</th>
                    <th className="py-4 px-5">Artisan</th>
                    <th className="py-4 px-4">Quantity</th>
                    <th className="py-4 px-4">Rate</th>
                    <th className="py-4 px-4">Base</th>
                    <th className="py-4 px-4">Incentive</th>
                    <th className="py-4 px-4">Total</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-5">Calculated</th>
                    <th className="py-4 px-5">Approved</th>
                    <th className="py-4 px-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Workflow Name */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{p.workflowName}</div>
                        {p.isCustom && (
                          <span className="inline-block mt-1 bg-[#e6f4ff] text-[#0066cc] text-[10px] font-semibold px-2 py-0.5 rounded">
                            Custom
                          </span>
                        )}
                      </td>

                      {/* Artisan Name */}
                      <td className="py-4 px-5 font-medium text-slate-700 whitespace-nowrap">
                        {p.artisanName}
                      </td>

                      {/* Quantity */}
                      <td className="py-4 px-4 text-slate-600 whitespace-nowrap font-medium">
                        {p.effectiveQuantity} {p.quantityType === 'UNIT' ? 'units' : 'm'}
                      </td>

                      {/* Rate + Save */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={editingRates[p.id] ?? p.rate}
                            onChange={(e) => handleRateChange(p.id, Number(e.target.value))}
                            className="w-16 px-2 py-1 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-slate-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRate(p.id)}
                            className="bg-black hover:bg-slate-800 text-white text-[11px] font-semibold px-2.5 py-1 rounded transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </td>

                      {/* Base Payment */}
                      <td className="py-4 px-4 text-slate-800 font-medium whitespace-nowrap">
                        ₹{p.basePayment.toLocaleString('en-IN')}
                      </td>

                      {/* Incentive */}
                      <td className="py-4 px-4 text-slate-600 whitespace-nowrap font-medium">
                        ₹{p.totalIncentive || 0}
                      </td>

                      {/* Total */}
                      <td className="py-4 px-4 text-slate-900 font-bold whitespace-nowrap">
                        ₹{p.totalPayment.toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                            p.status === 'APPROVED'
                              ? 'bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]'
                              : p.status === 'PAID'
                              ? 'bg-[#e6f7ff] text-[#1890ff] border border-[#91d5ff]'
                              : 'bg-[#fff7e6] text-[#d48806] border border-[#ffe58f]'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* Calculated Date */}
                      <td className="py-4 px-5 text-slate-600 whitespace-nowrap font-medium">
                        {formatDate(p.calculatedAt)}
                      </td>

                      {/* Approved Date */}
                      <td className="py-4 px-5 text-slate-500 whitespace-nowrap">
                        {formatDate(p.approvedAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2.5">
                          {p.status !== 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => handleApprove(p.id)}
                              className="bg-[#1f2338] hover:bg-black text-white text-[11px] font-semibold px-3 py-1 rounded transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all">
            <svg
              className="w-5 h-5 text-slate-700 stroke-[2.2]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            <span className="text-sm font-semibold text-slate-800 tracking-tight">
              Payment Settings
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

