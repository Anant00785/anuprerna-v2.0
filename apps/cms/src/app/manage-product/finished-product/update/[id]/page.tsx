'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ChevronDown, ChevronRight, Check } from 'lucide-react';
import {
  ProductService,
  ProductCategory,
  ProductSegment,
  ProductSubCategory,
  SkuGroup,
} from '@/services/product-service';
import { ProfileService } from '@/services/profile-service';

export default function UpdateFinishedProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const id = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Stepper State
  const [activeStep, setActiveStep] = useState<number>(1);

  // Taxonomy Lists
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [segments, setSegments] = useState<ProductSegment[]>([]);
  const [subCategories, setSubCategories] = useState<ProductSubCategory[]>([]);
  const [skuGroups, setSkuGroups] = useState<SkuGroup[]>([]);

  // STEP 1: Content Form State
  const [categoryName, setCategoryName] = useState('Apparel');
  const [segmentName, setSegmentName] = useState('WOMEN');
  const [subCategoryName, setSubCategoryName] = useState('DRESSES');
  const [name, setName] = useState('');
  const [skuGroupName, setSkuGroupName] = useState('Custom products');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [quantity, setQuantity] = useState<number | string>('0');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [unit, setUnit] = useState('UNIT');
  const [isMainProduct, setIsMainProduct] = useState(true);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoAltText, setVideoAltText] = useState('');
  const [backwardCompatibleLink, setBackwardCompatibleLink] = useState('');

  // STEP 2: Profiles State
  const [badgeProfiles, setBadgeProfiles] = useState<any[]>([]);
  const [customSizeProfiles, setCustomSizeProfiles] = useState<any[]>([]);
  const [sizeProfiles, setSizeProfiles] = useState<any[]>([]);
  const [volumeDiscountProfiles, setVolumeDiscountProfiles] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const [
          cats,
          segs,
          subs,
          skuGrps,
          badges,
          customSizes,
          sizes,
          volumeDiscounts,
          prodRes,
        ] = await Promise.all([
          ProductService.getCategories().catch(() => []),
          ProductService.getSegments().catch(() => []),
          ProductService.getSubCategories().catch(() => []),
          ProductService.getSkuGroups().catch(() => []),
          ProfileService.getBadgeProfiles().catch(() => []),
          ProfileService.getCustomSizeProfiles().catch(() => []),
          ProfileService.getSizeProfiles().catch(() => []),
          ProfileService.getVolumeDiscountProfiles().catch(() => []),
          ProductService.getFinishedProductById(id).catch(() => null),
        ]);

        setCategories(cats);
        setSegments(segs);
        setSubCategories(subs);
        setSkuGroups(skuGrps);
        setBadgeProfiles(badges);
        setCustomSizeProfiles(customSizes);
        setSizeProfiles(sizes);
        setVolumeDiscountProfiles(volumeDiscounts);

        // Populate fields from product
        const p = prodRes?.product || prodRes;
        if (p) {
          setName(p.name || '');
          setSku(p.sku || '');
          setPrice(p.price !== undefined ? p.price : '');
          setQuantity(p.totalQuantity !== undefined ? p.totalQuantity : (p.quantity || 0));
          setCategoryName(p.category?.name || 'Apparel');
          setSegmentName(p.segment?.name || 'WOMEN');
          setSubCategoryName(p.subCategory?.name || 'DRESSES');
          setSkuGroupName(p.skuGroup?.name || 'Custom products');
          setMetaTitle(p.metaTitle || p.metaDescription || '');
          setMetaDescription(p.metaDescription || '');
          setUnit(p.unit || 'UNIT');
          setIsMainProduct(p.mainProductCheck ?? true);
          setVideoUrl(p.videoUrl || '');
          setVideoAltText(p.videoAltText || '');
          setBackwardCompatibleLink(p.backwardCompatibleLink || p.slug || '');
        } else {
          // If direct endpoint did not return, fetch from list
          const previewList = await ProductService.getFinishedProducts();
          const found = previewList.find(
            (item: any) => String(item.product?.id || item.id) === String(id) || String(item.id) === String(id)
          );
          if (found) {
            const foundP = found.product || found;
            setName(foundP.name || '');
            setSku(foundP.sku || '');
            setPrice(foundP.price !== undefined ? foundP.price : '');
            setQuantity(foundP.totalQuantity !== undefined ? foundP.totalQuantity : (foundP.quantity || 0));
            setCategoryName(foundP.category?.name || 'Apparel');
            setSegmentName(foundP.segment?.name || 'WOMEN');
            setSubCategoryName(foundP.subCategory?.name || 'DRESSES');
            setSkuGroupName(foundP.skuGroup?.name || 'Custom products');
            setMetaTitle(foundP.metaTitle || 'Handwoven A-Line Panel Dress in Cotton – Ethical Women\'s Clothing');
            setMetaDescription(
              foundP.metaDescription ||
                'This handwoven A-line panel dress blends breathable cotton with timeless design—ethical women\'s dresses by Anuprerna.'
            );
            setUnit(foundP.unit || 'UNIT');
            setIsMainProduct(foundP.mainProductCheck ?? true);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeStep < 3) {
      setActiveStep(s => s + 1);
    } else {
      router.push('/manage-product/finished-product');
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#585c82] animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading finish product details...</p>
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
        <Link href="/manage-product/finished-product" className="hover:text-slate-900">
          Finished Product
        </Link>
        <span>/</span>
        <span>Update</span>
        <span>/</span>
        <span className="bg-[#ebeff8] text-[#585c82] px-2 py-0.5 rounded-full font-bold text-[10px]">
          {id}
        </span>
      </div>

      <h1 className="text-xl font-bold text-[#1f2438] uppercase tracking-tight">
        UPDATE FINISH PRODUCT
      </h1>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* ACCORDION / STEPPER CONTAINER */}
      <div className="space-y-4">
        {/* STEP 1: UPDATE CONTENT */}
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  activeStep === 1 ? 'bg-[#585c82]' : 'bg-slate-400'
                }`}
              >
                1
              </div>
              <span className="font-bold text-sm text-[#1f2438]">Update Content</span>
            </div>
            {activeStep === 1 ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {activeStep === 1 && (
            <form onSubmit={handleContinue} className="p-6 pt-0 space-y-6 border-t border-slate-100 mt-2">
              {/* ROW 1: CATEGORY + SEGMENT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={categoryName}
                    onChange={e => setCategoryName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
                  >
                    {categories.length > 0 ? (
                      categories.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Apparel">Apparel</option>
                        <option value="Home">Home</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Fabrics">Fabrics</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Segment <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={segmentName}
                    onChange={e => setSegmentName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
                  >
                    {segments.length > 0 ? (
                      segments.map(s => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="WOMEN">WOMEN</option>
                        <option value="MEN">MEN</option>
                        <option value="LIVING">LIVING</option>
                        <option value="DINING">DINING</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* ROW 2: SUB CATEGORY + PRODUCT NAME */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Sub Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={subCategoryName}
                    onChange={e => setSubCategoryName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
                  >
                    {subCategories.length > 0 ? (
                      subCategories.map(sc => (
                        <option key={sc.id} value={sc.name}>
                          {sc.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="DRESSES">DRESSES</option>
                        <option value="BOTTOMS">BOTTOMS</option>
                        <option value="SHIRTS">SHIRTS</option>
                        <option value="APRON">APRON</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A-Line Panel Dress | Solid White"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
                  />
                </div>
              </div>

              {/* ROW 3: SKU GROUP + PRODUCT SKU */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    SKU Group <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={skuGroupName}
                    onChange={e => setSkuGroupName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
                  >
                    {skuGroups.length > 0 ? (
                      skuGroups.map(sg => (
                        <option key={sg.id} value={sg.name}>
                          {sg.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Custom products">Custom products</option>
                        <option value="Standard">Standard</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Product SKU <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={sku}
                    className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-700 font-mono focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* ROW 4: PRICE + QUANTITY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Price <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1583"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
                  />
                </div>
              </div>

              {/* ROW 5: META TITLE + META DESCRIPTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Meta Title (Max 70 Characters) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={70}
                    placeholder="Handwoven A-Line Panel Dress in Cotton..."
                    value={metaTitle}
                    onChange={e => setMetaTitle(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Meta Description (Max 165 Characters) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={165}
                    placeholder="This handwoven A-line panel dress blends breathable cotton..."
                    value={metaDescription}
                    onChange={e => setMetaDescription(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
                  />
                </div>
              </div>

              {/* ROW 6: UNIT + IS MAIN PRODUCT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Unit <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
                  >
                    <option value="UNIT">UNIT</option>
                    <option value="PIECE">PIECE</option>
                    <option value="METER">METER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Is Main Product
                  </label>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsMainProduct(!isMainProduct)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        isMainProduct ? 'bg-[#585c82]' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          isMainProduct ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* ROW 7: VIDEO URL + VIDEO ALT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Video Url
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Video Alt Text
                  </label>
                  <input
                    type="text"
                    placeholder="Video description..."
                    value={videoAltText}
                    onChange={e => setVideoAltText(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
                  />
                </div>
              </div>

              {/* ROW 8: BACKWARD COMPATIBLE LINK */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Backward Compatible Link
                  </label>
                  <input
                    type="text"
                    placeholder="Legacy URL slug..."
                    value={backwardCompatibleLink}
                    onChange={e => setBackwardCompatibleLink(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
                  />
                </div>
              </div>

              {/* CONTINUE BUTTON */}
              <div className="pt-6 flex justify-center">
                <button
                  type="submit"
                  className="w-full sm:w-96 py-2.5 text-xs font-semibold text-white bg-[#585c82] hover:bg-[#484c70] rounded-lg shadow-xs transition-colors"
                >
                  Continue
                </button>
              </div>
            </form>
          )}
        </div>

        {/* STEP 2: MANAGE PROFILES */}
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  activeStep === 2 ? 'bg-[#585c82]' : 'bg-slate-400'
                }`}
              >
                2
              </div>
              <span className="font-bold text-sm text-[#1f2438]">Manage Profiles</span>
            </div>
            {activeStep === 2 ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {activeStep === 2 && (
            <div className="p-6 pt-0 space-y-6 border-t border-slate-100 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Badge Profile
                  </label>
                  <select className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]">
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
                  <select className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]">
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
                  <select className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]">
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
                    Volume Discount Profile
                  </label>
                  <select className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]">
                    <option value="">Select Profile</option>
                    {volumeDiscountProfiles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.profileName || `Profile (${p.id})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-6 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="w-full sm:w-64 py-2.5 text-xs font-semibold text-white bg-[#585c82] hover:bg-[#484c70] rounded-lg shadow-xs transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>

        {/* STEP 3: MANAGE GROUPS & FILTERS */}
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  activeStep === 3 ? 'bg-[#585c82]' : 'bg-slate-400'
                }`}
              >
                3
              </div>
              <span className="font-bold text-sm text-[#1f2438]">Manage Groups &amp; Filters</span>
            </div>
            {activeStep === 3 ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {activeStep === 3 && (
            <div className="p-6 pt-0 space-y-6 border-t border-slate-100 mt-2">
              <p className="text-xs text-slate-500 pt-4">
                Assign color, material, pattern filter tags, and SKU variations to this finished product.
              </p>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-6 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Finished product updated successfully!');
                    router.push('/manage-product/finished-product');
                  }}
                  className="w-full sm:w-64 py-2.5 text-xs font-semibold text-white bg-[#585c82] hover:bg-[#484c70] rounded-lg shadow-xs transition-colors"
                >
                  Save &amp; Finish
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
