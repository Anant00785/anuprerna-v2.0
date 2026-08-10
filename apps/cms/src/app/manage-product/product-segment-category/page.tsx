'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Plus,
  Loader2,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  Check,
  Folder,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { ProductService, ProductSegment, ProductCategory } from '@/services/product-service';

export default function ProductSegmentPage() {
  const [segments, setSegments] = useState<ProductSegment[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number>(0);
  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [socialImageUrl, setSocialImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [segData, catData] = await Promise.all([
        ProductService.getSegments(),
        ProductService.getCategories(),
      ]);
      setSegments(segData);
      setCategories(catData);
    } catch (err: any) {
      setError(err.message || 'Failed to load catalog segments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = {
    total: segments.length,
    withIcon: segments.filter(s => !!s.icon).length,
    withSocialImage: segments.filter(s => !!s.socialImage || !!s.icon).length,
    seoComplete: segments.filter(s => !!s.metaTitle || !!s.description).length,
  };

  // Filter Categories Pills
  const categoryCounts = categories.map(cat => ({
    name: cat.name,
    count: segments.filter(s => s.category?.name === cat.name || s.categoryId === cat.id).length,
  }));

  const filteredSegments = segments.filter(s => {
    const matchesCategory =
      activeCategoryFilter === 'ALL' ||
      (s.category?.name || '').toLowerCase() === activeCategoryFilter.toLowerCase();

    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      (s.category?.name || '').toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const openAddModal = () => {
    setEditingId(null);
    setCategoryId(categories[0]?.id || 0);
    setName('');
    setIconUrl('');
    setSocialImageUrl('');
    setDescription('');
    setMetaTitle('');
    setMetaDescription('');
    setModalOpen(true);
  };

  const openEditModal = (seg: ProductSegment) => {
    setEditingId(seg.id);
    setCategoryId(seg.category?.id || seg.categoryId || (categories[0]?.id || 0));
    setName(seg.name || '');
    setIconUrl(seg.icon || '');
    setSocialImageUrl(seg.socialImage || seg.icon || '');
    setDescription(seg.description || '');
    setMetaTitle(seg.metaTitle || '');
    setMetaDescription(seg.metaDescription || '');
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this segment?')) return;
    try {
      await ProductService.deleteSegment(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete segment.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const payload: Partial<ProductSegment> = {
        name: name.trim(),
        categoryId,
        icon: iconUrl.trim(),
        socialImage: socialImageUrl.trim(),
        description: description.trim(),
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
      };
      if (editingId) {
        payload.id = editingId;
        await ProductService.updateSegment(payload);
      } else {
        await ProductService.createSegment(payload);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/manage-product"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📁</span>
              <h1 className="text-xl font-bold text-slate-900">Segments</h1>
            </div>
            <p className="text-xs text-slate-500">
              The second tier of the catalog — segments live inside categories and group sub-categories
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Segment</span>
        </button>
      </div>

      {/* STATS STRIP (MATCHING SCREENSHOT 1) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-28">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{stats.total}</span>
            <span className="text-xl">📁</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total</span>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-28">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{stats.withIcon}</span>
            <span className="text-xl">🖼️</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">With Icon</span>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-28">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{stats.withSocialImage}</span>
            <span className="text-xl">📣</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">With Social Image</span>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-28">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{stats.seoComplete}</span>
            <span className="text-xl">🧠</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">SEO Complete</span>
        </div>
      </div>

      {/* CATEGORY FILTER PILLS (MATCHING SCREENSHOT 1) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategoryFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            activeCategoryFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({segments.length})
        </button>
        {categoryCounts.map(cat => (
          <button
            key={cat.name}
            onClick={() => setActiveCategoryFilter(cat.name)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              activeCategoryFilter === cat.name
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.name} ({cat.count})
          </button>
        ))}
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search segments by name or description..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-400"
        />
      </div>

      {/* CARDS GRID (MATCHING SCREENSHOT 1) */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading catalog segments...</p>
        </div>
      ) : filteredSegments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center gap-2">
          <span className="text-3xl">🔍</span>
          <p className="font-semibold text-slate-800">No segments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredSegments.map(seg => (
            <div
              key={seg.id}
              className="bg-slate-50 hover:bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* CATEGORY BADGE */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-xs">
                  <span>📁</span>
                  <span>{seg.category?.name || 'Category'}</span>
                </div>

                {/* ICON / THUMBNAIL */}
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center">
                  {seg.icon ? (
                    // eslint-disable-next-next/no-img-element
                    <img src={seg.icon} alt={seg.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <Layers className="w-7 h-7 text-slate-400" />
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base tracking-tight">{seg.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {seg.metaTitle || seg.description || 'Shop Anuprerna exclusive handcrafted collection.'}
                  </p>
                </div>
              </div>

              {/* FOOTER */}
              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2 font-mono">
                  <span>#{seg.id}</span>
                  <span>•</span>
                  <span>Created 2y ago</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(seg)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(seg.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL / FORM FOR ADDING / UPDATING SEGMENT (MATCHING SCREENSHOT 2) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base uppercase tracking-tight">
                {editingId ? `UPDATE SEGMENT #${editingId}` : 'ADD NEW SEGMENT'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Product Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Segment Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DECOR, DYED PLAIN WEAVES..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* IMAGE URLS WITH PREVIEWS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div className="space-y-2">
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider">
                    Icon Image URL <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://anuprerna.../icon.png"
                    value={iconUrl}
                    onChange={e => setIconUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                  />
                  {iconUrl && (
                    <div className="w-32 h-32 rounded-xl bg-slate-100 border border-slate-200 p-2 overflow-hidden flex items-center justify-center relative group">
                      {/* eslint-disable-next-next/no-img-element */}
                      <img src={iconUrl} alt="Icon preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider">
                    Social Image URL <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://anuprerna.../social.jpg"
                    value={socialImageUrl}
                    onChange={e => setSocialImageUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                  />
                  {socialImageUrl && (
                    <div className="w-32 h-32 rounded-xl bg-slate-100 border border-slate-200 p-2 overflow-hidden flex items-center justify-center relative group">
                      {/* eslint-disable-next-next/no-img-element */}
                      <img src={socialImageUrl} alt="Social preview" className="w-full h-full object-cover rounded-lg" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Meta Title (SEO)
                </label>
                <input
                  type="text"
                  placeholder="Meta title..."
                  value={metaTitle}
                  onChange={e => setMetaTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Meta Description (SEO)
                </label>
                <textarea
                  rows={2}
                  placeholder="Meta description..."
                  value={metaDescription}
                  onChange={e => setMetaDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all shadow-sm"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{submitting ? 'Saving...' : 'Save Segment'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
