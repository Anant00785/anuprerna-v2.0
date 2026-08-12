'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Plus, Loader2, RefreshCw, Edit2, Trash2, X, Check, Tag as TagIcon, Sparkles, AlertTriangle } from 'lucide-react';
import { ProductService, SkuGroup } from '@/services/product-service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const RECENT_WINDOW_DAYS = 30;

export default function SkuGroupPage() {
  const [skuGroups, setSkuGroups] = useState<SkuGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ProductService.getSkuGroups();
      setSkuGroups(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load SKU groups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredGroups = skuGroups.filter(g => !searchTerm || (g.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

  // Summary Metrics
  const statsTotal = skuGroups.length;
  const statsNewThisMonth = skuGroups.filter(g => (g.timeOfCreation ?? 0) > Date.now() - RECENT_WINDOW_DAYS * MS_PER_DAY).length;
  const statsWithTrailingSpace = skuGroups.filter(g => {
    const n = g.name || '';
    return n.length > 0 && n !== n.trim();
  }).length;

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setModalOpen(true);
  };

  const openEditModal = (g: SkuGroup) => {
    setEditingId(g.id);
    setName(g.name || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      if (editingId) await ProductService.updateSkuGroup(editingId, name);
      else await ProductService.createSkuGroup(name);
      setModalOpen(false);
      loadData();
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
      await ProductService.deleteSkuGroup(deletingId);
      setDeletingId(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete SKU group');
    } finally {
      setDeleting(false);
    }
  };

  const relativeTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const days = Math.max(0, Math.floor((Date.now() - timestamp) / MS_PER_DAY));
    if (days < 1) return 'today';
    if (days < 7) return `${days}d`;
    if (days < 30) return `${Math.floor(days / 7)}w`;
    if (days < 365) return `${Math.floor(days / 30)}mo`;
    return `${Math.floor(days / 365)}y`;
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/manage-product"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">SKU Groups</h1>
            <p className="text-xs text-slate-500">Grouping parameters for product stock keeping units</p>
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
            <span>Add SKU Group</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <TagIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{statsTotal}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{statsNewThisMonth}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NEW THIS MONTH</div>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm flex items-center gap-4 ${
          statsWithTrailingSpace > 0 ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-white border-slate-200'
        }`}>
          <div className={`p-3 rounded-xl ${statsWithTrailingSpace > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className={`text-2xl font-black ${statsWithTrailingSpace > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {statsWithTrailingSpace}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WITH TRAILING SPACE</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search SKU groups..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-400"
        />
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading SKU groups...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredGroups.map(g => (
            <div key={g.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4 group hover:border-slate-300 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm shadow-inner">
                    #{g.name}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{g.name}</h3>
                    {g.timeOfCreation ? (
                      <span className="text-[11px] text-slate-400">Created {relativeTime(g.timeOfCreation)} ago</span>
                    ) : (
                      <span className="text-[11px] text-slate-400">ID #{g.id}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                <span className="font-mono">#{g.id}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(g)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingId(g.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">{editingId ? 'Edit SKU Group' : 'Add SKU Group'}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Group Name / Code *</label>
              <input type="text" required placeholder="e.g. 25, 102, 76..." value={name} onChange={e => setName(e.target.value)} className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm">
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Group</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete SKU Group</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this SKU group? This action cannot be undone.
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
