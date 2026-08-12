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
  Package,
  Image as ImageIcon,
  Share2,
  Sparkles,
} from 'lucide-react';
import { ProductService, ProductCategory } from '@/services/product-service';

export default function ProductCategoryPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [socialImageUrl, setSocialImageUrl] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ProductService.getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch product categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter(c => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
  });

  const stats = {
    total: categories.length,
    withIcon: categories.filter(c => !!c.icon).length,
    withSocialImage: categories.filter(c => !!c.socialImage).length,
    seoComplete: categories.filter(c => !!c.metaTitle && !!c.metaDescription).length,
  };

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setIconUrl('');
    setSocialImageUrl('');
    setMetaTitle('');
    setMetaDescription('');
    setModalOpen(true);
  };

  const openEditModal = (cat: ProductCategory) => {
    setEditingId(cat.id);
    setName(cat.name || '');
    setDescription(cat.description || '');
    setIconUrl(cat.icon || '');
    setSocialImageUrl(cat.socialImage || '');
    setMetaTitle(cat.metaTitle || '');
    setMetaDescription(cat.metaDescription || '');
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await ProductService.deleteCategory(id);
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const payload: Partial<ProductCategory> = {
        name: name.trim(),
        description: description.trim(),
        icon: iconUrl.trim(),
        socialImage: socialImageUrl.trim(),
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
      };
      if (editingId) {
        payload.id = editingId;
        await ProductService.updateCategory(payload);
      } else {
        await ProductService.createCategory(payload);
      }
      setModalOpen(false);
      fetchCategories();
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
            <h1 className="text-xl font-bold text-slate-900">Product Categories</h1>
            <p className="text-xs text-slate-500">
              The top of the catalog — the root of every product on the storefront
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* STATS STRIP (MATCHING SCREENSHOT 2) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-28">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{stats.total}</span>
            <span className="text-xl">📦</span>
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

      {/* SEARCH BAR */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search categories by name or description..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-400"
        />
      </div>

      {/* CARDS GRID (MATCHING SCREENSHOT 2) */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading catalog categories...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center gap-2">
          <span className="text-3xl">🔍</span>
          <p className="font-semibold text-slate-800">No categories found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCategories.map(cat => (
            <div
              key={cat.id}
              className="bg-slate-50 hover:bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* ICON / THUMBNAIL */}
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center">
                  {cat.icon ? (
                    // eslint-disable-next-next/no-img-element
                    <img src={cat.icon} alt={cat.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <Package className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{cat.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {cat.metaTitle || cat.description || 'Shop authentic handwoven & handcrafted textiles.'}
                  </p>
                </div>
              </div>

              {/* FOOTER */}
              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2 font-mono">
                  <span>#{cat.id}</span>
                  <span>•</span>
                  <span>Created 3y ago</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
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

      {/* MODAL FOR ADDING / EDITING CATEGORY */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingId ? 'Edit Product Category' : 'Add New Category'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apparel, Fabrics, Accessories..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short summary of this category..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Icon Image URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://s3.../icon.png"
                    value={iconUrl}
                    onChange={e => setIconUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Social Image URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://s3.../banner.png"
                    value={socialImageUrl}
                    onChange={e => setSocialImageUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Meta Title (SEO)
                </label>
                <input
                  type="text"
                  placeholder="Anuprerna - Handwoven artisanal fabric..."
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
                  placeholder="Shop authentic handwoven & handcrafted fabric from artisans..."
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
                <span>{submitting ? 'Saving...' : 'Save Category'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
