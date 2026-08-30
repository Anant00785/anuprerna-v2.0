'use client';

import React, { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { WhatsappService, ConsentEntry } from '@/services/whatsapp-service';

type ConsentTab = 'all' | 'opted-in' | 'opted-out' | 'marketing';

export default function WhatsAppConsentManagerPage() {
  const [entries, setEntries] = useState<ConsentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState<ConsentTab>('all');
  const [searchTerm, setSearchTerm] = useState('');

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
      !q ||
      (entry.name || '').toLowerCase().includes(q) ||
      (entry.phone || '').includes(q) ||
      (entry.email || '').toLowerCase().includes(q);
    return matchesSearch && matchesTab(entry);
  });

  const totalOptedIn = entries.filter(e => e.status === 'active').length;
  const totalOptedOut = entries.filter(e => e.status === 'opted-out').length;
  const marketingConsented = entries.filter(e => e.marketing).length;

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
    <div className="space-y-6 pt-2 pb-16">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-[#1f2438] tracking-tight">
          WhatsApp Consent Manager
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage customer communication preferences and consent status
        </p>
      </div>

      {/* 3 SUMMARY STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl">
        <div className="bg-[#f0f4f9] rounded-xl p-5 border border-slate-200/60 shadow-xs">
          <div className="text-3xl font-extrabold text-[#1f2438]">{totalOptedIn}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">Total Opted In</div>
        </div>

        <div className="bg-[#f0f4f9] rounded-xl p-5 border border-slate-200/60 shadow-xs">
          <div className="text-3xl font-extrabold text-[#1f2438]">{totalOptedOut}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">Total Opted Out</div>
        </div>

        <div className="bg-[#f0f4f9] rounded-xl p-5 border border-slate-200/60 shadow-xs">
          <div className="text-3xl font-extrabold text-[#1f2438]">{marketingConsented}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">Marketing Consented</div>
        </div>
      </div>

      {/* FILTER BAR & DOWNLOAD CSV */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              All Users
            </button>
            <button
              onClick={() => setActiveTab('opted-in')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'opted-in'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Opted In
            </button>
            <button
              onClick={() => setActiveTab('opted-out')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'opted-out'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Opted Out
            </button>
            <button
              onClick={() => setActiveTab('marketing')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'marketing'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Marketing
            </button>
          </div>

          <div className="w-64">
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
            />
          </div>
        </div>

        <div>
          <button
            onClick={handleDownloadCsv}
            disabled={filteredEntries.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-[#585c82] animate-spin" />
            <p className="text-xs text-slate-500 font-light tracking-wide uppercase">
              Fetching customer consent directory...
            </p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No consent records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-white text-slate-600 font-bold tracking-tight">
                  <th className="py-4 px-5">Name</th>
                  <th className="py-4 px-5">Email</th>
                  <th className="py-4 px-5">Phone</th>
                  <th className="py-4 px-4 text-center">Order Updates</th>
                  <th className="py-4 px-4 text-center">Production Updates</th>
                  <th className="py-4 px-4 text-center">Marketing</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-5">Consent Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name */}
                    <td className="py-3.5 px-5 whitespace-nowrap font-semibold text-slate-900">
                      {entry.name}
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-5 whitespace-nowrap text-slate-500">
                      {entry.email || '—'}
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-5 whitespace-nowrap text-slate-600 font-medium">
                      {entry.phone || '—'}
                    </td>

                    {/* Order Updates */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {entry.orderUpdates ? (
                        <div className="w-4 h-4 rounded-full bg-[#18a058] flex items-center justify-center mx-auto">
                          <svg className="w-2.5 h-2.5 text-white stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center mx-auto">
                          <svg className="w-2.5 h-2.5 text-slate-500 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </div>
                      )}
                    </td>

                    {/* Production Updates */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {entry.productionUpdates ? (
                        <div className="w-4 h-4 rounded-full bg-[#18a058] flex items-center justify-center mx-auto">
                          <svg className="w-2.5 h-2.5 text-white stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center mx-auto">
                          <svg className="w-2.5 h-2.5 text-slate-500 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </div>
                      )}
                    </td>

                    {/* Marketing */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {entry.marketing ? (
                        <div className="w-4 h-4 rounded-full bg-[#18a058] flex items-center justify-center mx-auto">
                          <svg className="w-2.5 h-2.5 text-white stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center mx-auto">
                          <svg className="w-2.5 h-2.5 text-slate-500 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#18a058] text-white">
                        {entry.status === 'active' ? 'Active' : 'Opted Out'}
                      </span>
                    </td>

                    {/* Consent Expiry */}
                    <td className="py-3.5 px-5 whitespace-nowrap text-slate-500">
                      {entry.consentExpiry === -1 ? 'Never' : new Date(entry.consentExpiry).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

