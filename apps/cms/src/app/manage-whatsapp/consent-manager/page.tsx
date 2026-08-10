'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Download,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  UserCheck,
  UserX,
  Megaphone,
} from 'lucide-react';
import { WhatsappService, ConsentEntry, ConsentStats } from '@/services/whatsapp-service';

type ConsentTab = 'all' | 'opted-in' | 'opted-out' | 'marketing';

export default function WhatsAppConsentManagerPage() {
  const [entries, setEntries] = useState<ConsentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState<ConsentTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchConsentData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await WhatsappService.getCustomerWhatsAppStatusList();
      setEntries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customer WhatsApp status list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsentData();
  }, []);

  const matchesTab = (entry: ConsentEntry): boolean => {
    switch (activeTab) {
      case 'opted-in':
        return entry.status === 'active';
      case 'opted-out':
        return entry.status === 'opted-out';
      case 'marketing':
        return entry.marketing;
      default:
        return true;
    }
  };

  const filteredEntries = entries.filter(entry => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q || (entry.name || '').toLowerCase().includes(q) || (entry.phone || '').includes(q) || (entry.email || '').toLowerCase().includes(q);
    return matchesSearch && matchesTab(entry);
  });

  const paginatedEntries = filteredEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredEntries.length / pageSize) || 1;

  const stats: ConsentStats = {
    totalOptedIn: entries.filter(e => e.status === 'active').length,
    totalOptedOut: entries.filter(e => e.status === 'opted-out').length,
    marketingConsented: entries.filter(e => e.marketing).length,
    pending: entries.filter(e => e.status === 'pending').length,
  };

  const handleDownloadCsv = () => {
    const headers = ['Name', 'Email', 'Phone', 'Order Updates', 'Production Updates', 'Marketing', 'Status', 'Consent Expiry'];
    const rows = filteredEntries.map(e =>
      [
        `"${e.name}"`,
        `"${e.email}"`,
        `"${e.phone}"`,
        e.orderUpdates,
        e.productionUpdates,
        e.marketing,
        e.status,
        e.consentExpiry === -1 ? 'Never' : new Date(e.consentExpiry).toISOString(),
      ].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whatsapp-consent-manager.csv';
    a.click();
    URL.revokeObjectURL(url);
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
            <h1 className="text-xl font-bold text-slate-900">WhatsApp Consent Manager</h1>
            <p className="text-xs text-slate-500">Track opt-in statuses and preference channels for customers</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchConsentData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleDownloadCsv}
            disabled={filteredEntries.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-2xl font-extrabold text-slate-900">{stats.totalOptedIn}</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Opted-In</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-rose-500" />
            <span className="text-2xl font-extrabold text-slate-900">{stats.totalOptedOut}</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Opted-Out</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-600" />
            <span className="text-2xl font-extrabold text-slate-900">{stats.marketingConsented}</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Marketing Consented</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span className="text-2xl font-extrabold text-slate-900">{entries.length}</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Customers</span>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96 flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search by customer name or mobile number..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-end sm:self-auto">
          <button
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              setActiveTab('opted-in');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'opted-in' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Opted In ({stats.totalOptedIn})
          </button>
          <button
            onClick={() => {
              setActiveTab('opted-out');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'opted-out' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Opted Out ({stats.totalOptedOut})
          </button>
          <button
            onClick={() => {
              setActiveTab('marketing');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'marketing' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Marketing ({stats.marketingConsented})
          </button>
        </div>
      </div>

      {/* TABLE */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Fetching customer consent directory...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center gap-2">
          <span className="text-3xl">🔍</span>
          <p className="font-semibold text-slate-800">No consent records found</p>
          <p className="text-sm text-slate-400">Try adjusting your search filter or active tab</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Customer Details</th>
                  <th className="px-6 py-3.5">WhatsApp Mobile</th>
                  <th className="px-6 py-3.5 text-center">Order Updates</th>
                  <th className="px-6 py-3.5 text-center">Production BTS</th>
                  <th className="px-6 py-3.5 text-center">Marketing</th>
                  <th className="px-6 py-3.5">Consent Expiry</th>
                  <th className="px-6 py-3.5 text-right">Opt-in Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{entry.name}</div>
                      <div className="text-xs text-slate-400">{entry.email || 'No email registered'}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-800">
                      {entry.phone || '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {entry.orderUpdates ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {entry.productionUpdates ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {entry.marketing ? (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {entry.consentExpiry === -1
                        ? 'Never Expires'
                        : new Date(entry.consentExpiry).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {entry.status === 'active' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Opted In</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Opted Out</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {Math.min(filteredEntries.length, (currentPage - 1) * pageSize + 1)} to{' '}
              {Math.min(filteredEntries.length, currentPage * pageSize)} of {filteredEntries.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded bg-white border border-slate-200 font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-100"
              >
                Previous
              </button>
              <span className="font-bold text-slate-800">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded bg-white border border-slate-200 font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-100"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
