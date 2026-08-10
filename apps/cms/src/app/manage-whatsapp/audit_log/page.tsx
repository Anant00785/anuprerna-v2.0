'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Download,
  Loader2,
  RefreshCw,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  CheckCheck,
  RotateCw,
  FileCode,
} from 'lucide-react';
import {
  WhatsappService,
  AuditLogEntry,
  WhatsappDeliveryStatusPollSummary,
} from '@/services/whatsapp-service';

export default function WhatsAppAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Polling state
  const [isPolling, setIsPolling] = useState(false);
  const [pollBanner, setPollBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Slide-over drawer state
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const fetchAuditLog = async (page: number = 1) => {
    setLoading(true);
    setError('');
    try {
      const data = await WhatsappService.getAuditLog(page, pageSize);
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load WhatsApp audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLog(currentPage);
  }, [currentPage]);

  const filteredLogs = logs.filter(log => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (log.requestId ?? '').toLowerCase().includes(q) ||
      (log.to ?? '').includes(q) ||
      (log.template ?? '').toLowerCase().includes(q) ||
      (log.tenantName ?? '').toLowerCase().includes(q);

    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalSent: logs.length,
    totalDelivered: logs.filter(l => l.status === 'DELIVERED' || l.status === 'READ').length,
    totalRead: logs.filter(l => l.status === 'READ').length,
    totalFailed: logs.filter(l => ['POST_FAILED', 'POST_ERROR', 'FAILED_DELIVERY'].includes(l.status)).length,
  };

  const summaryToBanner = (summary: WhatsappDeliveryStatusPollSummary): string => {
    if (summary.candidatesScanned === 0) {
      return 'No messages were due for a delivery-status refresh.';
    }
    const parts = [
      `${summary.requestBatchesQueried} batch(es) queried`,
      `${summary.rowsTransitioned} updated`,
      `${summary.rowsUnchanged} unchanged`,
    ];
    if (summary.failedBatches > 0) parts.push(`${summary.failedBatches} failed`);
    let text = parts.join(', ') + '.';
    if (summary.rateLimited) text += ' Rate-limited by Freshchat — run again to continue.';
    return text;
  };

  const handleRefreshDeliveryStatuses = async () => {
    if (isPolling) return;
    setIsPolling(true);
    setPollBanner(null);
    try {
      const summary = await WhatsappService.pollDeliveryStatusWithinWindow();
      setPollBanner({ type: 'success', text: summaryToBanner(summary) });
      fetchAuditLog(currentPage);
    } catch (err: any) {
      setPollBanner({ type: 'error', text: 'Delivery-status poll failed. Please try again.' });
    } finally {
      setIsPolling(false);
    }
  };

  const handleReconcileStaleBacklog = async () => {
    if (isPolling) return;
    setIsPolling(true);
    setPollBanner(null);
    try {
      const summary = await WhatsappService.pollDeliveryStatusStaleBacklog();
      setPollBanner({ type: 'success', text: summaryToBanner(summary) });
      fetchAuditLog(currentPage);
    } catch (err: any) {
      setPollBanner({ type: 'error', text: 'Stale backlog reconciliation failed.' });
    } finally {
      setIsPolling(false);
    }
  };

  const handlePollSingleEntry = async (entry: AuditLogEntry) => {
    if (isPolling) return;
    setIsPolling(true);
    setPollBanner(null);
    try {
      const summary = await WhatsappService.pollDeliveryStatusById(entry.id);
      setPollBanner({ type: 'success', text: `Message #${entry.id}: ${summaryToBanner(summary)}` });
      fetchAuditLog(currentPage);
    } catch (err: any) {
      setPollBanner({ type: 'error', text: `Single poll failed for message #${entry.id}.` });
    } finally {
      setIsPolling(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ['#', 'Request ID', 'To Mobile', 'Tenant Name', 'Template', 'Trigger', 'Status', 'Created At'];
    const rows = filteredLogs.map((l, i) =>
      [i + 1, `"${l.requestId}"`, `"${l.to}"`, `"${l.tenantName}"`, `"${l.template}"`, `"${l.triggerType}"`, `"${l.status}"`, `"${l.createdAt}"`].join(
        ','
      )
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whatsapp-audit-log.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'READ':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
            <CheckCheck className="w-3 h-3 text-purple-600" /> READ
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
            <CheckCheck className="w-3 h-3 text-emerald-600" /> DELIVERED
          </span>
        );
      case 'SENT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 inline-flex items-center gap-1">
            <Send className="w-3 h-3 text-sky-600" /> SENT
          </span>
        );
      case 'QUEUED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" /> QUEUED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-600" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/manage-whatsapp"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">WhatsApp Audit Log &amp; Delivery Monitor</h1>
            <p className="text-xs text-slate-500">Real-time status tracking for outbound HSM WhatsApp notifications</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefreshDeliveryStatuses}
            disabled={isPolling}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin' : ''}`} />
            <span>Poll Delivery Status</span>
          </button>
          <button
            onClick={handleReconcileStaleBacklog}
            disabled={isPolling}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Reconcile Stale</span>
          </button>
          <button
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* POLL NOTIFICATION BANNER */}
      {pollBanner && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            pollBanner.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {pollBanner.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{pollBanner.text}</span>
          </div>
          <button onClick={() => setPollBanner(null)} className="p-1 hover:bg-black/5 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STATS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">📨</span>
            <span className="text-2xl font-extrabold text-slate-900">{stats.totalSent}</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Page Sent</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <span className="text-2xl font-extrabold text-slate-900">{stats.totalDelivered}</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivered</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">👁️</span>
            <span className="text-2xl font-extrabold text-slate-900">{stats.totalRead}</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Read</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span className="text-2xl font-extrabold text-slate-900">{stats.totalFailed}</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Failed / Errors</span>
        </div>
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96 flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search by Request ID, mobile, template or customer..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Filter:</label>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="READ">Read</option>
            <option value="DELIVERED">Delivered</option>
            <option value="SENT">Sent</option>
            <option value="QUEUED">Queued</option>
            <option value="FAILED_DELIVERY">Failed Delivery</option>
            <option value="POST_FAILED">Post Failed</option>
            <option value="POST_ERROR">Post Error</option>
          </select>
        </div>
      </div>

      {/* CONTENT TABLE */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Fetching outbound WhatsApp notification history...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center gap-2">
          <span className="text-3xl">🔍</span>
          <p className="font-semibold text-slate-800">No WhatsApp notification logs found</p>
          <p className="text-sm text-slate-400">Try adjusting your search query or status filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Recipient &amp; Customer</th>
                  <th className="px-6 py-3.5">HSM Template</th>
                  <th className="px-6 py-3.5">Trigger Event</th>
                  <th className="px-6 py-3.5">Sent / Created At</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* RECIPIENT */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{log.tenantName || 'Customer'}</div>
                      <div className="text-xs font-mono text-slate-500">{log.to}</div>
                    </td>

                    {/* HSM TEMPLATE */}
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50/70 px-2.5 py-1 rounded-md border border-indigo-100 inline-block">
                        {log.template}
                      </div>
                      {log.entityType && (
                        <div className="text-[11px] text-slate-400 mt-1 font-semibold">
                          {log.entityType} #{log.entityId}
                        </div>
                      )}
                    </td>

                    {/* TRIGGER EVENT */}
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px]">
                        {log.triggerType}
                      </span>
                    </td>

                    {/* SENT / CREATED AT */}
                    <td className="px-6 py-4 text-xs text-slate-600 whitespace-nowrap">
                      {log.sentAt || log.createdAt}
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {getStatusBadge(log.status)}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedEntry(log)}
                          title="Inspect Payload & Details"
                          className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePollSingleEntry(log)}
                          title="Poll Freshchat Delivery Status"
                          className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Page {currentPage} (Showing 20 records per page)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded bg-white border border-slate-200 font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-100"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={logs.length < pageSize}
                className="px-3 py-1.5 rounded bg-white border border-slate-200 font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-100"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER DRAWER FOR AUDIT LOG INSPECTION */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* DRAWER HEADER */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">Message Audit Details</h2>
                    {getStatusBadge(selectedEntry.status)}
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-1">ID: #{selectedEntry.id} • Request: {selectedEntry.requestId}</p>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SECTION 1: RECIPIENT & TEMPLATE */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 uppercase font-semibold block mb-0.5">Recipient Mobile</span>
                    <span className="font-mono font-bold text-slate-900">{selectedEntry.to}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold block mb-0.5">Sender Mobile</span>
                    <span className="font-mono font-bold text-slate-900">{selectedEntry.from}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold block mb-0.5">Customer / Tenant</span>
                    <span className="font-bold text-slate-900">{selectedEntry.tenantName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold block mb-0.5">HSM Template Name</span>
                    <span className="font-mono font-bold text-indigo-600">{selectedEntry.template}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: TIMELINE */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Delivery Timeline &amp; Polling</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Created At</span>
                    <span className="font-semibold text-slate-800">{selectedEntry.createdAt || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Sent At</span>
                    <span className="font-semibold text-slate-800">{selectedEntry.sentAt || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Delivered At</span>
                    <span className="font-semibold text-slate-800">{selectedEntry.deliveredAt || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Read At</span>
                    <span className="font-semibold text-slate-800">{selectedEntry.readAt || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Last Polled At</span>
                    <span className="font-semibold text-slate-800">{selectedEntry.lastPolledAt || 'Never'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Poll Attempts</span>
                    <span className="font-semibold text-slate-800">{selectedEntry.pollAttemptCount || 0}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: BODY PARAMETERS & BUTTON URL */}
              {((selectedEntry.bodyParameters || []).length > 0 || selectedEntry.buttonUrl || selectedEntry.headerMediaUrl) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Message Content &amp; Media</h4>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    {selectedEntry.headerMediaUrl && (
                      <div>
                        <span className="text-slate-400 font-medium block">Header Media URL:</span>
                        <a href={selectedEntry.headerMediaUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline break-all font-mono">
                          {selectedEntry.headerMediaUrl}
                        </a>
                      </div>
                    )}
                    {selectedEntry.buttonUrl && (
                      <div>
                        <span className="text-slate-400 font-medium block">Button Action URL:</span>
                        <a href={selectedEntry.buttonUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline break-all font-mono">
                          {selectedEntry.buttonUrl}
                        </a>
                      </div>
                    )}
                    {(selectedEntry.bodyParameters || []).length > 0 && (
                      <div>
                        <span className="text-slate-400 font-medium block mb-1">Body Template Parameters:</span>
                        <div className="space-y-1">
                          {selectedEntry.bodyParameters?.map(p => (
                            <div key={p.key} className="flex items-center gap-2 bg-white px-2.5 py-1 rounded border border-slate-200 font-mono text-[11px]">
                              <span className="text-slate-400">{p.key}:</span>
                              <span className="font-semibold text-slate-800">{p.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 4: RAW REQUEST & RESPONSE PAYLOADS */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <FileCode className="w-4 h-4 text-indigo-600" />
                  <span>Payload Inspection</span>
                </div>
                {selectedEntry.requestPayload && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500">Request Payload:</span>
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto max-h-40">
                      {selectedEntry.requestPayload}
                    </pre>
                  </div>
                )}
                {selectedEntry.responsePayload && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500">Response Payload:</span>
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto max-h-40">
                      {selectedEntry.responsePayload}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* DRAWER FOOTER */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
