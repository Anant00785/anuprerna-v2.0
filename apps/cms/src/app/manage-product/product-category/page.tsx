'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Loader2, Search } from 'lucide-react';
import { ProductService, ProductCategory } from '@/services/product-service';

export default function ProductCategoryPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ProductService.getCategories();
      // Filter out duplicate or legacy upper case if needed, or display all
      const unique = data.filter(c => c.name && c.name !== 'FABRIC');
      setCategories(unique.length > 0 ? unique : data);
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
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q) ||
      (c.metaTitle || '').toLowerCase().includes(q)
    );
  });

  const stats = {
    total: categories.length,
    withIcon: categories.filter(c => !!c.icon).length,
    withSocialImage: categories.filter(c => !!c.socialImage).length,
    seoComplete: categories.filter(c => !!c.metaTitle && !!c.metaDescription).length,
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

  const formatRelativeTime = (epoch?: number) => {
    if (!epoch || epoch <= 0) return '3y ago';
    const now = Date.now();
    const diffYears = Math.floor((now - epoch) / (1000 * 60 * 60 * 24 * 365));
    if (diffYears >= 1) return `${diffYears}y ago`;
    const diffMonths = Math.floor((now - epoch) / (1000 * 60 * 60 * 24 * 30));
    if (diffMonths >= 1) return `${diffMonths}mo ago`;
    return 'recently';
  };

  return (
    <div className="space-y-6 pt-2 pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">
            📷
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1f2438] tracking-tight">Product Categories</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              The top of the catalog — the root of every product on the storefront
            </p>
          </div>
        </div>

        <Link
          href="/manage-product/product-category/create"
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#18181b] hover:bg-black rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Category</span>
        </Link>
      </div>

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <div className="bg-[#f0f4f9] p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between h-28">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-[#1f2438]">{stats.total}</span>
            <span className="text-lg">💼</span>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">TOTAL</span>
        </div>

        <div className="bg-[#f0f4f9] p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between h-28">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-[#1f2438]">{stats.withIcon}</span>
            <span className="text-lg">🖼️</span>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">WITH ICON</span>
        </div>

        <div className="bg-[#f0f4f9] p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between h-28">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-[#1f2438]">{stats.withSocialImage}</span>
            <span className="text-lg">📣</span>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">WITH SOCIAL IMAGE</span>
        </div>

        <div className="bg-[#f0f4f9] p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between h-28">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-[#1f2438]">{stats.seoComplete}</span>
            <span className="text-lg">🧠</span>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">SEO COMPLETE</span>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/70 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
        <input
          type="text"
          placeholder="Search categories by name or description..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full text-xs text-slate-800 bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-400"
        />
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* CATEGORY CARDS GRID */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl shadow-xs border border-slate-100 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 text-[#585c82] animate-spin" />
          <p className="text-xs text-slate-500 font-light tracking-wide uppercase">
            Loading catalog categories...
          </p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-xs border border-slate-100 text-center text-slate-400 text-sm">
          No categories found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCategories.map(cat => (
            <div
              key={cat.id}
              className="bg-[#f0f4f9] rounded-2xl p-6 border border-slate-200/60 shadow-xs flex flex-col justify-between min-h-[300px] hover:shadow-md transition-all"
            >
              <div>
                {/* ICON */}
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/60 shadow-xs overflow-hidden flex items-center justify-center p-2 mb-3">
                  {cat.icon ? (
                    <img
                      src={cat.icon}
                      alt={cat.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-2xl">📁</span>
                  )}
                </div>

                {/* TITLE & META */}
                <h3 className="font-bold text-slate-900 text-sm">{cat.name}</h3>
                <p className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-0.5">
                  {cat.metaTitle || cat.description || `Shop Handcrafted ${cat.name}`}
                </p>
                <p className="text-xs text-slate-500 line-clamp-3 mt-2 leading-relaxed">
                  {cat.description || 'Shop authentic handwoven & handcrafted textiles.'}
                </p>
              </div>

              {/* FOOTER */}
              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-400 mt-4">
                <div className="flex items-center font-mono text-[10px]">
                  <span>#{cat.id}</span>
                  <span className="ml-2 font-sans font-medium text-slate-400">
                    Created {formatRelativeTime(cat.timeOfCreation)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/manage-product/product-category/update/${cat.id}`}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-colors"
                    title="Edit Category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-white/60 transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
