'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, X } from 'lucide-react';
import {
  ProductService,
  ProductCategory,
  ProductSegment,
} from '@/services/product-service';
import { ProfileService } from '@/services/profile-service';

export default function UpdateProductSubCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const id = resolvedParams.id;

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [segments, setSegments] = useState<ProductSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form Basic Fields
  const [categoryId, setCategoryId] = useState<number>(0);
  const [segmentId, setSegmentId] = useState<number>(0);
  const [name, setName] = useState('');
  const [avgWorkHoursPerMeter, setAvgWorkHoursPerMeter] = useState<string>('');
  const [featured, setFeatured] = useState<boolean>(true);
  const [icon, setIcon] = useState('');
  const [socialImage, setSocialImage] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  // Profile Options State
  const [badgeProfiles, setBadgeProfiles] = useState<any[]>([]);
  const [customSizeProfiles, setCustomSizeProfiles] = useState<any[]>([]);
  const [sizeProfiles, setSizeProfiles] = useState<any[]>([]);
  const [fabricProfiles, setFabricProfiles] = useState<any[]>([]);
  const [washProfiles, setWashProfiles] = useState<any[]>([]);
  const [madeToOrderProfiles, setMadeToOrderProfiles] = useState<any[]>([]);
  const [volumeDiscountProfiles, setVolumeDiscountProfiles] = useState<any[]>([]);

  // Selected Profile IDs
  const [selectedBadgeProfile, setSelectedBadgeProfile] = useState<string>('');
  const [selectedCustomSizeProfile, setSelectedCustomSizeProfile] = useState<string>('');
  const [selectedSizeProfile, setSelectedSizeProfile] = useState<string>('');
  const [selectedFabricProfile, setSelectedFabricProfile] = useState<string>('');
  const [selectedWashProfile, setSelectedWashProfile] = useState<string>('');
  const [selectedMadeToOrderProfile, setSelectedMadeToOrderProfile] = useState<string>('');
  const [selectedVolumeDiscountProfile, setSelectedVolumeDiscountProfile] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const [
          subs,
          segs,
          cats,
          badges,
          customSizes,
          sizes,
          fabrics,
          washes,
          madeToOrders,
          volumeDiscounts,
        ] = await Promise.all([
          ProductService.getSubCategories(),
          ProductService.getSegments(),
          ProductService.getCategories(),
          ProfileService.getBadgeProfiles().catch(() => []),
          ProfileService.getCustomSizeProfiles().catch(() => []),
          ProfileService.getSizeProfiles().catch(() => []),
          ProfileService.getFabricProfiles().catch(() => []),
          ProfileService.getFinishProfiles().catch(() => []),
          ProfileService.getMadeToOrderProfiles().catch(() => []),
          ProfileService.getVolumeDiscountProfiles().catch(() => []),
        ]);

        setCategories(cats);
        setSegments(segs);
        setBadgeProfiles(badges);
        setCustomSizeProfiles(customSizes);
        setSizeProfiles(sizes);
        setFabricProfiles(fabrics);
        setWashProfiles(washes);
        setMadeToOrderProfiles(madeToOrders);
        setVolumeDiscountProfiles(volumeDiscounts);

        const found = subs.find(s => String(s.id) === String(id));
        if (found) {
          setName(found.name || '');
          const parentSeg =
            found.segment || segs.find(s => s.id === found.segmentId);
          const parentCatId =
            parentSeg?.category?.id ||
            parentSeg?.categoryId ||
            cats[0]?.id ||
            0;

          setCategoryId(parentCatId);
          setSegmentId(found.segmentId || parentSeg?.id || 0);
          setAvgWorkHoursPerMeter(
            found.avgWorkHoursPerMeter ? String(found.avgWorkHoursPerMeter) : ''
          );
          setFeatured(found.featured ?? true);
          setIcon(found.icon || '');
          setSocialImage(found.socialImage || found.icon || '');
          setMetaTitle(found.metaTitle || '');
          setMetaDescription(found.metaDescription || '');

          // Selected Profiles
          if (found.badgeProfileId) setSelectedBadgeProfile(String(found.badgeProfileId));
          if (found.customSizeProfileId) setSelectedCustomSizeProfile(String(found.customSizeProfileId));
          if (found.sizeProfileId) setSelectedSizeProfile(String(found.sizeProfileId));
          if (found.fabricProfileId) setSelectedFabricProfile(String(found.fabricProfileId));
          if (found.finishProfileId || found.washProfileId) setSelectedWashProfile(String(found.finishProfileId || found.washProfileId));
          if (found.madeToOrderProfileId) setSelectedMadeToOrderProfile(String(found.madeToOrderProfileId));
          if (found.volumeDiscountProfileId) setSelectedVolumeDiscountProfile(String(found.volumeDiscountProfileId));
        } else {
          setError('Sub category not found.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load sub category.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const availableSegments = segments.filter(
    s => !categoryId || s.category?.id === categoryId || s.categoryId === categoryId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await ProductService.updateSubCategory({
        id: Number(id),
        segmentId,
        name: name.trim(),
        avgWorkHoursPerMeter: avgWorkHoursPerMeter
          ? Number(avgWorkHoursPerMeter)
          : undefined,
        featured,
        icon: icon.trim(),
        socialImage: socialImage.trim(),
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
        badgeProfileId: selectedBadgeProfile ? Number(selectedBadgeProfile) : undefined,
        customSizeProfileId: selectedCustomSizeProfile ? Number(selectedCustomSizeProfile) : undefined,
        sizeProfileId: selectedSizeProfile ? Number(selectedSizeProfile) : undefined,
        fabricProfileId: selectedFabricProfile ? Number(selectedFabricProfile) : undefined,
        finishProfileId: selectedWashProfile ? Number(selectedWashProfile) : undefined,
        madeToOrderProfileId: selectedMadeToOrderProfile ? Number(selectedMadeToOrderProfile) : undefined,
        volumeDiscountProfileId: selectedVolumeDiscountProfile ? Number(selectedVolumeDiscountProfile) : undefined,
      });
      router.push('/manage-product/product-sub-category');
    } catch (err: any) {
      alert(err.message || 'Failed to update sub category.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#585c82] animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading sub category details...</p>
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
        <Link href="/manage-product/product-sub-category" className="hover:text-slate-900">
          Product Sub Category
        </Link>
        <span>/</span>
        <span>Update</span>
        <span>/</span>
        <span className="bg-[#ebeff8] text-[#585c82] px-2 py-0.5 rounded-full font-bold text-[10px]">
          {id}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1f2438] uppercase tracking-tight">
          UPDATE SUB CATEGORY
        </h1>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-700 font-medium">
            Show under featured products
          </span>
          <button
            type="button"
            onClick={() => setFeatured(!featured)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              featured ? 'bg-[#e02d6b]' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                featured ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200/70 shadow-xs space-y-8">
        {/* ROW 1: CATEGORY + SEGMENT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Product Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={e => {
                const newCatId = Number(e.target.value);
                setCategoryId(newCatId);
                const nextSegs = segments.filter(
                  s => s.category?.id === newCatId || s.categoryId === newCatId
                );
                if (nextSegs.length > 0) {
                  setSegmentId(nextSegs[0].id);
                }
              }}
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
              Product Segment <span className="text-rose-500">*</span>
            </label>
            <select
              value={segmentId}
              onChange={e => setSegmentId(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
            >
              {availableSegments.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ROW 2: SUB CATEGORY NAME + AVG WORK HOURS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Sub Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Avg Work Hours Per Meter
            </label>
            <input
              type="text"
              placeholder="e.g. 4.5"
              value={avgWorkHoursPerMeter}
              onChange={e => setAvgWorkHoursPerMeter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
            />
          </div>
        </div>

        {/* ROW 3: ICON WITH PREVIEW */}
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
                <img src={icon} alt="Sub Category Icon" className="max-w-full max-h-full object-contain" />
                <button
                  type="button"
                  onClick={() => setIcon('')}
                  className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-sm hover:bg-rose-600"
                  title="Remove Icon"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="w-64 h-48 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                No Icon Preview
              </div>
            )}
          </div>
        </div>

        {/* ROW 4: SOCIAL IMAGE WITH PREVIEW */}
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
              <div className="relative group w-64 h-80 rounded-xl bg-white border border-slate-200 p-2 flex items-center justify-center">
                <img src={socialImage} alt="Social Image" className="max-w-full max-h-full object-contain rounded-lg" />
                <button
                  type="button"
                  onClick={() => setSocialImage('')}
                  className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-sm hover:bg-rose-600"
                  title="Remove Social Image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="w-64 h-80 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                No Social Image Preview
              </div>
            )}
          </div>
        </div>

        {/* ROW 5: META TITLE & META DESCRIPTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Meta Title
            </label>
            <input
              type="text"
              placeholder="e.g. Customizable Handwoven Apron | Stylish & Functional Kitchen Wear..."
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
              placeholder="e.g. Buy Aprons Online in India - Choose from a variety of options..."
              value={metaDescription}
              onChange={e => setMetaDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
            />
          </div>
        </div>

        {/* SECTION: MAP PROFILE TO SUB CATEGORY */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="bg-[#585c82] text-white text-xs font-bold px-4 py-2 rounded-t-lg uppercase tracking-wider">
            MAP PROFILE TO SUB CATEGORY
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* LEFT COLUMN: BADGE, CUSTOM SIZE, SIZE, FABRIC */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Badge Profile
                </label>
                <select
                  value={selectedBadgeProfile}
                  onChange={e => setSelectedBadgeProfile(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
                >
                  <option value="">Select Profile</option>
                  {badgeProfiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.profileName || `Profile (${p.id})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Custom Size Profile
                </label>
                <select
                  value={selectedCustomSizeProfile}
                  onChange={e => setSelectedCustomSizeProfile(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
                >
                  <option value="">Select Profile</option>
                  {customSizeProfiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.profileName || `Profile (${p.id})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Size Profile
                </label>
                <select
                  value={selectedSizeProfile}
                  onChange={e => setSelectedSizeProfile(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
                >
                  <option value="">Select Profile</option>
                  {sizeProfiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.profileName || `Profile (${p.id})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Fabric Profile
                </label>
                <select
                  value={selectedFabricProfile}
                  onChange={e => setSelectedFabricProfile(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
                >
                  <option value="">Select Profile</option>
                  {fabricProfiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.profileName || `Profile (${p.id})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* RIGHT COLUMN: WASH, MADE TO ORDER, VOLUME DISCOUNT */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Wash Profile
                </label>
                <select
                  value={selectedWashProfile}
                  onChange={e => setSelectedWashProfile(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
                >
                  <option value="">Select Profile</option>
                  {washProfiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.profileName || `Profile (${p.id})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Made To Order Profile
                </label>
                <select
                  value={selectedMadeToOrderProfile}
                  onChange={e => setSelectedMadeToOrderProfile(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
                >
                  <option value="">Select Profile</option>
                  {madeToOrderProfiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.profileName || `Profile (${p.id})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Volume Discount Profile
                </label>
                <select
                  value={selectedVolumeDiscountProfile}
                  onChange={e => setSelectedVolumeDiscountProfile(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
                >
                  <option value="">Select Profile</option>
                  {volumeDiscountProfiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.profileName || `Profile (${p.id})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
