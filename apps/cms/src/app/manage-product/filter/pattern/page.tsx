'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Loader2, X, Search } from 'lucide-react';
import { ProductService, PatternFilter } from '@/services/product-service';

export default function PatternFilterPage() {
  const [patterns, setPatterns] = useState<PatternFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPatterns = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ProductService.getPatterns();
      setPatterns(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load patterns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatterns();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setModalOpen(true);
  };

  const openEditModal = (p: PatternFilter) => {
    setEditingId(p.id);
    setName(p.name || '');
    setDescription(p.description || '');
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this pattern?')) return;
    try {
      await ProductService.deletePattern(id);
      fetchPatterns();
    } catch (err: any) {
      alert(err.message || 'Failed to delete pattern.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      if (editingId) {
        await ProductService.updatePattern(editingId, name, description);
      } else {
        await ProductService.createPattern(name, description);
      }
      setModalOpen(false);
      fetchPatterns();
    } catch (err: any) {
      alert(err.message || 'Failed to save pattern.');
    } finally {
      setSaving(false);
    }
  };

  const filteredPatterns = patterns.filter(p =>
    !searchTerm.trim() || (p.name || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="space-y-6 pt-2 pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🧬</div>
          <div>
            <h1 className="text-xl font-bold text-[#1f2438] tracking-tight">Pattern Filters</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Visual weave motifs, stripes, checks, and textures
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-64">
            <input
              type="text"
              placeholder="Search patterns..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#585c82]"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#585c82] hover:bg-[#484c70] rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Pattern</span>
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
              Loading patterns...
            </p>
          </div>
        ) : filteredPatterns.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No patterns found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-white text-slate-400 font-bold tracking-tight">
                  <th className="py-4 px-6">🧬 PATTERN NAME</th>
                  <th className="py-4 px-6">📝 DESCRIPTION</th>
                  <th className="py-4 px-6 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatterns.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap font-bold text-slate-900">
                      {p.name}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {p.description || '—'}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-3">
                        <button
                          onClick={() => openEditModal(p)}
                          className="text-slate-600 hover:text-slate-900 transition-colors p-1"
                          title="Edit Pattern"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-slate-600 hover:text-rose-600 transition-colors p-1"
                          title="Delete Pattern"
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

      {/* ADD/EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1f2438]">
                {editingId ? 'Edit Pattern' : 'Add Pattern'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pattern Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jamdani Motifs, Stripes, Checks"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#585c82]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional pattern description..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#585c82]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#585c82] hover:bg-[#484c70] rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingId ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
