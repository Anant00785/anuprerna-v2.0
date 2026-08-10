'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeading } from '@/components/ui/PageHeading';
import {
  EmailAuditLogItem,
  EmailAuditService,
  EmailLogStatus,
} from '@/services/email-audit-service';
import {
  Search,
  Download,
  RefreshCw,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
} from 'lucide-react';

export default function EmailAuditLogPage() {
  const [logs, setLogs] = useState<EmailAuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [orderIdFilter, setOrderIdFilter] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination State - Default 20 items per page
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(20);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await EmailAuditService.getEmailLogs();
      setLogs(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Metric Rollups directly calculated from log data
  const metrics = useMemo(() => {
    const total = logs.length;
    const sent = logs.filter((l) => l.status === 'Sent').length;
    const failed = logs.filter((l) => l.status === 'Failed').length;
    const retriggered = logs.filter((l) => l.status === 'Retriggered').length;
    return { total, sent, failed, retriggered };
  }, [logs]);

  // Filtered List
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Status filter
      if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;

      // Order ID filter
      if (
        orderIdFilter.trim() &&
        !String(log.orderId || '').toLowerCase().includes(orderIdFilter.trim().toLowerCase())
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTrigger = log.trigger.toLowerCase().includes(q);
        const matchTo = log.to.toLowerCase().includes(q);
        const matchOrder = String(log.orderId || '').toLowerCase().includes(q);
        if (!matchTrigger && !matchTo && !matchOrder) return false;
      }

      return true;
    });
  }, [logs, statusFilter, orderIdFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const startItem = filteredLogs.length > 0 ? currentPage * pageSize + 1 : 0;
  const endItem = Math.min((currentPage + 1) * pageSize, filteredLogs.length);

  const paginatedLogs = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Handle Retrigger Action
  const handleRetrigger = async (id: number) => {
    await EmailAuditService.retriggerEmail(id);

    // Update log entry status to Retriggered
    setLogs((prev) =>
      prev.map((log) =>
        log.id === id
          ? {
              ...log,
              status: 'Retriggered' as EmailLogStatus,
              attempt: log.attempt + 1,
              createdAt: new Date().toLocaleString('en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              }),
            }
          : log
      )
    );

    setToastMessage(`Email #${id} successfully retriggered! Delivery queued.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Export CSV of filtered results
  const exportCsv = () => {
    const headers = ['#', 'TRIGGER', 'ORDER', 'TO', 'STATUS', 'ATTEMPT', 'CREATED AT'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.trigger,
      l.orderId || '-',
      l.to,
      l.status,
      l.attempt,
      l.createdAt,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.map((x) => `"${x}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `email_audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <PageHeading heading="Email Audit Log" />
        <p className="text-slate-500 text-sm mt-1">
          Track every order email triggered, its delivery status, and retrigger any send
        </p>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-sm text-emerald-800 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 border-l-4 border-l-indigo-600 shadow-2xs space-y-1">
          <div className="text-3xl font-extrabold text-slate-900">{metrics.total}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</div>
        </div>
        {/* Sent */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 shadow-2xs space-y-1">
          <div className="text-3xl font-extrabold text-slate-900">{metrics.sent}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sent</div>
        </div>
        {/* Failed */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 border-l-4 border-l-red-500 shadow-2xs space-y-1">
          <div className="text-3xl font-extrabold text-slate-900">{metrics.failed}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Failed</div>
        </div>
        {/* Retriggered */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 border-l-4 border-l-blue-500 shadow-2xs space-y-1">
          <div className="text-3xl font-extrabold text-slate-900">{metrics.retriggered}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Retriggered</div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by recipient, trigger, template, or order id..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(0);
          }}
          className="w-full md:w-40 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
        >
          <option value="ALL">All Status</option>
          <option value="Sent">Sent</option>
          <option value="Failed">Failed</option>
          <option value="Retriggered">Retriggered</option>
          <option value="Pending">Pending</option>
        </select>

        {/* Order ID Filter */}
        <input
          type="text"
          placeholder="Filter by Order ID"
          value={orderIdFilter}
          onChange={(e) => {
            setOrderIdFilter(e.target.value);
            setCurrentPage(0);
          }}
          className="w-full md:w-44 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />

        {/* Refresh */}
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="p-2 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition shrink-0"
          title="Refresh email logs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* Export CSV */}
        <button
          onClick={exportCsv}
          className="w-full md:w-auto px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs flex items-center justify-center gap-2 shrink-0 transition"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">TRIGGER</th>
                <th className="px-5 py-3">ORDER</th>
                <th className="px-5 py-3">TO</th>
                <th className="px-5 py-3">STATUS</th>
                <th className="px-5 py-3">ATTEMPT</th>
                <th className="px-5 py-3">CREATED AT</th>
                <th className="px-5 py-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-600">{log.id}</td>
                  <td className="px-5 py-4 font-mono font-bold text-slate-800">{log.trigger}</td>
                  <td className="px-5 py-4 font-mono font-semibold text-slate-700">
                    {log.orderId || '-'}
                  </td>
                  <td className="px-5 py-4 text-slate-800 font-medium">{log.to}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        log.status === 'Sent'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : log.status === 'Failed'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : log.status === 'Retriggered'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-700 font-semibold">{log.attempt}</td>
                  <td className="px-5 py-4 text-slate-600 font-mono">{String(log.createdAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleRetrigger(log.id)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition inline-flex items-center gap-1"
                      title="Retrigger email send"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Retrigger</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredLogs.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600 font-medium">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{filteredLogs.length}</strong> results
              </span>
              <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(0);
                  }}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="mr-2 text-slate-500">
                Page <strong>{currentPage + 1}</strong> of <strong>{totalPages}</strong>
              </span>

              <button
                onClick={() => setCurrentPage(0)}
                disabled={currentPage === 0}
                className="p-1.5 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="p-1.5 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="p-1.5 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage(totalPages - 1)}
                disabled={currentPage >= totalPages - 1}
                className="p-1.5 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            {loading ? 'Loading email audit logs...' : 'No email logs found matching filters.'}
          </div>
        )}
      </div>
    </div>
  );
}
