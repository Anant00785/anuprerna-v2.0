'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, Lock } from 'lucide-react';
import { ContentService, BlogType } from '@/services/content-service';

export default function BlogTypesPage() {
  const [types, setTypes] = useState<BlogType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<BlogType | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTypes = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ContentService.getBlogTypes();
      setTypes(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load blog types.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const openAddModal = () => {
    setEditingType(null);
    setName('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: BlogType) => {
    setEditingType(item);
    setName(item.name || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      if (editingType) {
        await ContentService.updateBlogType(editingType.id, name);
      } else {
        await ContentService.createBlogType(name);
      }
      setIsModalOpen(false);
      fetchTypes();
    } catch (err: any) {
      alert(err.message || 'Failed to save blog type');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (epoch?: number) => {
    if (!epoch || epoch <= 0) return '—';
    return new Date(epoch).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 pt-2 pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">
            🏷️
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1f2438] tracking-tight">Blog Types</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Top-level groupings for blog content ✨
            </p>
          </div>
        </div>

        <div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#585c82] hover:bg-[#484c70] rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Type</span>
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
              Loading blog types...
            </p>
          </div>
        ) : types.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No blog types found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-white text-slate-400 font-bold tracking-tight">
                  <th className="py-4 px-6">🏷️ TYPE NAME</th>
                  <th className="py-4 px-6">📁 CATEGORIES</th>
                  <th className="py-4 px-6">📅 CREATED</th>
                  <th className="py-4 px-6 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {types.map(t => {
                  const isProtected = (t.name || '').trim().toLowerCase() === 'blogs' || t.name === 'Blogs';
                  const catCount = t.blogContentCatogoryList?.length || 0;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* NAME */}
                      <td className="py-4 px-6 whitespace-nowrap font-semibold text-slate-900">
                        {t.name}
                      </td>

                      {/* CATEGORIES COUNT */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold bg-[#e6f7ef] text-[#18a058]">
                          {catCount}
                        </span>
                      </td>

                      {/* CREATED */}
                      <td className="py-4 px-6 whitespace-nowrap text-slate-500">
                        {formatDate(t.timeOfCreation)}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        {isProtected ? (
                          <div className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                            <span>🔒</span>
                            <span>Protected</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-3">
                            <button
                              onClick={() => openEditModal(t)}
                              className="text-slate-600 hover:text-slate-900 transition-colors p-1"
                              title="Edit Type"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete blog type "${t.name}"?`)) {
                                  // delete logic
                                }
                              }}
                              className="text-slate-600 hover:text-rose-600 transition-colors p-1"
                              title="Delete Type"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1f2438]">
                {editingType ? 'Edit Blog Type' : 'Add Blog Type'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Editorial, Newsletter"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#585c82]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  <span>{editingType ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
