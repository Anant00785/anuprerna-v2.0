'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Loader2, RefreshCw, X, Check } from 'lucide-react';
import { LogisticService, ForexRate } from '@/services/logistic-service';

export default function ManageForexPage() {
  const [rates, setRates] = useState<ForexRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [country, setCountry] = useState('United States');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [exchangeRateToInr, setExchangeRateToInr] = useState('83.50');
  const [markupPercentage, setMarkupPercentage] = useState('2.5');
  const [submitting, setSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await LogisticService.getForexList();
      setRates(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load forex exchange rates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setCountry('United States');
    setCurrencyCode('USD');
    setCurrencySymbol('$');
    setExchangeRateToInr('83.50');
    setMarkupPercentage('2.5');
    setModalOpen(true);
  };

  const openEditModal = (r: ForexRate) => {
    setEditingId(r.id || null);
    setCountry(r.country || 'United States');
    setCurrencyCode(r.currencyCode || 'USD');
    setCurrencySymbol(r.currencySymbol || '$');
    setExchangeRateToInr(String(r.exchangeRateToInr || '83.50'));
    setMarkupPercentage(String(r.markupPercentage || '2.5'));
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currencyCode.trim() || !exchangeRateToInr) return;
    setSubmitting(true);
    try {
      const payload: Partial<ForexRate> = {
        id: editingId || Date.now(),
        country: country.trim(),
        currencyCode: currencyCode.trim().toUpperCase(),
        currencySymbol: currencySymbol.trim(),
        exchangeRateToInr: parseFloat(exchangeRateToInr) || 0,
        markupPercentage: parseFloat(markupPercentage) || 0,
        lastUpdated: Date.now(),
      };

      if (editingId) {
        await LogisticService.updateForex(payload);
        setRates(prev => prev.map(r => r.id === editingId ? { ...r, ...payload } as ForexRate : r));
      } else {
        await LogisticService.createForex(payload);
        setRates(prev => [payload as ForexRate, ...prev]);
      }
      setModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await LogisticService.deleteForex(deletingId);
      setRates(prev => prev.filter(r => r.id !== deletingId));
      setDeletingId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete forex rate.');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Just now';
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-100/80 rounded-2xl text-2xl">💱</div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Forex Rates</h1>
            <p className="text-xs text-slate-500 font-normal">
              Manage multi-currency exchange rates and conversion markups for international storefront pricing ✨
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Rate</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading foreign exchange rates...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">💱 CURRENCY CODE</th>
                  <th className="px-6 py-4">🔣 SYMBOL</th>
                  <th className="px-6 py-4">📈 EXCHANGE RATE TO INR</th>
                  <th className="px-6 py-4">📊 MARKUP (%)</th>
                  <th className="px-6 py-4">🕒 LAST UPDATED</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No forex exchange rates configured.
                    </td>
                  </tr>
                ) : (
                  rates.map((r, idx) => {
                    const code = r.currencyCode || r.currency || 'USD';
                    const symbol = r.currencySymbol || r.symbol || '$';
                    const rateVal = r.exchangeRateToInr ?? r.rate ?? 1;
                    const markupVal = r.markupPercentage ?? r.markup ?? 0;

                    return (
                      <tr key={r.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-black text-slate-900 text-base flex items-center gap-2">
                          <span>{code}</span>
                          {r.country && <span className="text-xs font-medium text-slate-400">({r.country})</span>}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">{symbol}</td>
                        <td className="px-6 py-4 font-bold text-emerald-600">
                          1 {code} = ₹{rateVal}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                          +{markupVal}%
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">{formatDate(r.lastUpdated)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(r)}
                              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                              title="Edit Rate"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => r.id && setDeletingId(r.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                              title="Delete Rate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Forex Rate Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">{editingId ? 'Edit Forex Rate' : 'Add Forex Rate'}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Country / Region</label>
              <input type="text" placeholder="e.g. United States, Eurozone" value={country} onChange={e => setCountry(e.target.value)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Currency Code *</label>
                <input type="text" required placeholder="e.g. USD, EUR, GBP" value={currencyCode} onChange={e => setCurrencyCode(e.target.value)} className="w-full px-3.5 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Symbol *</label>
                <input type="text" required placeholder="e.g. $, €, £" value={currencySymbol} onChange={e => setCurrencySymbol(e.target.value)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Exchange Rate to INR (1 {currencyCode} = ₹) *</label>
              <input type="number" step="0.01" required placeholder="e.g. 83.50" value={exchangeRateToInr} onChange={e => setExchangeRateToInr(e.target.value)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Markup Percentage (%)</label>
              <input type="number" step="0.1" placeholder="e.g. 2.5" value={markupPercentage} onChange={e => setMarkupPercentage(e.target.value)} className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm">
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Rate</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Forex Rate</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this forex exchange rate? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm"
              >
                {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
