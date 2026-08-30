'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, X } from 'lucide-react';
import { ProductService, ProductCategory } from '@/services/product-service';

export default function UpdateProductSegmentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const id = resolvedParams.id;

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [categoryId, setCategoryId] = useState<number>(0);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [socialImage, setSocialImage] = useState('');
  const [description, setDescription] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  useEffect(() => {
    async function loadSegment() {
      setLoading(true);
      setError('');
      try {
        const [segments, cats] = await Promise.all([
          ProductService.getSegments(),
          ProductService.getCategories(),
        ]);
        setCategories(cats);

        const found = segments.find(s => String(s.id) === String(id));
        if (found) {
          setName(found.name || '');
          setCategoryId(found.category?.id || found.categoryId || (cats[0]?.id || 0));
          setIcon(found.icon || '');
          setSocialImage(found.socialImage || found.icon || '');
          setDescription(found.description || '');
          setMetaTitle(found.metaTitle || '');
          setMetaDescription(found.metaDescription || '');
        } else {
          setError('Segment not found.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load segment.');
      } finally {
        setLoading(false);
      }
    }
    loadSegment();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await ProductService.updateSegment({
        id: Number(id),
        categoryId,
        name: name.trim(),
        icon: icon.trim(),
        socialImage: socialImage.trim(),
        description: description.trim(),
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
      });
      router.push('/manage-product/product-segment-category');
    } catch (err: any) {
      alert(err.message || 'Failed to update segment.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#585c82] animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading segment details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2 pb-16 max-w-6xl">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/manage-product" className="hover:text-slate-900">
          Manage Product
        </Link>
        <span>/</span>
        <Link href="/manage-product/product-segment-category" className="hover:text-slate-900">
          Product Segment Category
        </Link>
        <span>/</span>
        <span>Update</span>
        <span>/</span>
        <span className="bg-[#ebeff8] text-[#585c82] px-2 py-0.5 rounded-full font-bold text-[10px]">
          {id}
        </span>
      </div>

      <h1 className="text-xl font-bold text-[#1f2438] uppercase tracking-tight">
        UPDATE SEGMENT
      </h1>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200/70 shadow-xs space-y-8">
        {/* ROW 1: PRODUCT CATEGORY + SEGMENT NAME */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Product Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Segment Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
            />
          </div>
        </div>

        {/* ROW 2: ICON WITH PREVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Icon <span className="text-rose-500">*</span>
            </label>
            <div className="border border-slate-300 rounded-lg p-2 bg-[#f4f4f5] flex items-center justify-between">
              <label className="cursor-pointer inline-flex items-center px-3 py-1 bg-[#e4e4e7] border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-200">
                Choose File
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setIcon(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-slate-500 ml-3 flex-1 truncate">
                {icon ? 'Image selected' : 'No file chosen'}
              </span>
            </div>
          </div>

          {/* ICON PREVIEW */}
          <div className="flex justify-center md:justify-start">
            {icon ? (
              <div className="relative group w-64 h-48 rounded-xl bg-white border border-slate-200 p-4 flex items-center justify-center">
                <img src={icon} alt="Segment Icon" className="max-w-full max-h-full object-contain" />
                <button
                  type="button"
                  onClick={() => setIcon('')}
                  className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-sm hover:bg-rose-600"
                  title="Remove Icon"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-64 h-48 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                No Icon Preview
              </div>
            )}
          </div>
        </div>

        {/* ROW 3: SOCIAL IMAGE WITH PREVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Social Image <span className="text-rose-500">*</span>
            </label>
            <div className="border border-slate-300 rounded-lg p-2 bg-[#f4f4f5] flex items-center justify-between">
              <label className="cursor-pointer inline-flex items-center px-3 py-1 bg-[#e4e4e7] border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-200">
                Choose File
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setSocialImage(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-slate-500 ml-3 flex-1 truncate">
                {socialImage ? 'Image selected' : 'No file chosen'}
              </span>
            </div>
          </div>

          {/* SOCIAL IMAGE PREVIEW */}
          <div className="flex justify-center md:justify-start">
            {socialImage ? (
              <div className="relative group w-64 h-48 rounded-xl bg-white border border-slate-200 p-4 flex items-center justify-center">
                <img src={socialImage} alt="Social Image" className="max-w-full max-h-full object-contain" />
                <button
                  type="button"
                  onClick={() => setSocialImage('')}
                  className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-sm hover:bg-rose-600"
                  title="Remove Social Image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-64 h-48 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                No Social Image Preview
              </div>
            )}
          </div>
        </div>

        {/* ROW 4: META TITLE & META DESCRIPTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Meta Title
            </label>
            <input
              type="text"
              placeholder="e.g. Women's Bags | Shop Exclusive Styles | Anuprerna"
              value={metaTitle}
              onChange={e => setMetaTitle(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Meta Description
            </label>
            <input
              type="text"
              placeholder="e.g. Shop Anuprerna's exclusive collection of handcrafted bags..."
              value={metaDescription}
              onChange={e => setMetaDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
            />
          </div>
        </div>

        {/* BOTTOM UPDATE BUTTON */}
        <div className="pt-4 flex justify-center">
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full sm:w-96 py-2.5 text-xs font-semibold text-white bg-[#585c82] hover:bg-[#484c70] rounded-lg shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Update</span>
          </button>
        </div>
      </form>
    </div>
  );
}
