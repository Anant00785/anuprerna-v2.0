'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  Search,
  Info,
  BookOpen,
} from 'lucide-react';

export default function UpdateFilterPageSeoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const id = resolvedParams.id;

  const [saving, setSaving] = useState(false);

  // Product Type
  const [productType, setProductType] = useState<'Fabric' | 'Finished'>('Fabric');

  // Filter Permutations
  const [selectedColours, setSelectedColours] = useState<string[]>(['Beige', 'Brown']);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(['Cotton', 'Linen']);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>(['Check']);
  const [selectedSegments, setSelectedSegments] = useState<string[]>(['DYED PLAIN WEAVES']);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(['HANDWOVEN LINEN']);

  // Search terms
  const [colourSearch, setColourSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [patternSearch, setPatternSearch] = useState('');
  const [segmentSearch, setSegmentSearch] = useState('');
  const [subCategorySearch, setSubCategorySearch] = useState('');

  // Ranges
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minGsm, setMinGsm] = useState('');
  const [maxGsm, setMaxGsm] = useState('');
  const [minAvailability, setMinAvailability] = useState('');
  const [maxAvailability, setMaxAvailability] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Form Fields
  const [pageTitle, setPageTitle] = useState('Check Cotton Handwoven Linen Fabric in Beige & Brown');
  const [metaTitle, setMetaTitle] = useState(
    'Check Cotton Handwoven Linen Fabric in Beige & Brown — Made to Order | Anuprerna'
  );
  const [metaDescription, setMetaDescription] = useState(
    'Shop check Cotton Handwoven Linen Fabric in Beige & Brown by the metre from Anuprerna — handwoven by artisans in East India, naturally dyed and made to order with low MOQ for slow-fashion labels.'
  );

  // Banner
  const [bannerHeading, setBannerHeading] = useState('Check Cotton Handwoven Linen Fabric in Beige & Brown');
  const [bannerImage, setBannerImage] = useState('');

  // Status
  const [isActive, setIsActive] = useState(true);

  // Lists
  const colourOptions = [
    { name: 'White', count: 1022 },
    { name: 'Blue', count: 612 },
    { name: 'Green', count: 492 },
    { name: 'Black', count: 441 },
    { name: 'Brown', count: 397 },
    { name: 'Yellow', count: 277 },
    { name: 'Beige', count: 254 },
    { name: 'Red', count: 189 },
  ];

  const materialOptions = [
    { name: 'Cotton', count: 2013 },
    { name: 'Handspun Khadi', count: 704 },
    { name: 'Matka Peace Silk', count: 62 },
    { name: 'Mulberry Silk', count: 38 },
    { name: 'Linen', count: 34 },
    { name: 'Tussar Silk', count: 22 },
  ];

  const patternOptions = [
    { name: 'Check', count: 1135 },
    { name: 'Stripe', count: 764 },
    { name: 'Solid Color', count: 266 },
    { name: 'RFD (Dyeable)', count: 240 },
    { name: 'Chambray', count: 216 },
    { name: 'Geometric', count: 102 },
  ];

  const segmentOptions = [
    { name: 'DYED PLAIN WEAVES', count: 2091 },
    { name: 'ECO ESSENTIALS', count: 4 },
    { name: 'EMBROIDERY TECHNIQUE', count: 622 },
    { name: 'INDIAN PREMIUM', count: 122 },
    { name: 'ORGANIC AND', count: 187 },
    { name: 'PRINTED DESIGN', count: 130 },
  ];

  const subCategoryOptions = [
    { name: 'HANDWOVEN LINEN', count: 28 },
    { name: 'HANDWOVEN MERI...', count: 11 },
    { name: 'KHESH RECYCLED F...', count: 16 },
    { name: 'PIECE DYED COTTO...', count: 70 },
    { name: 'YARN DYED KHAD...', count: 1963 },
  ];

  const toggleSelection = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const liveKeyParts = [];
  if (selectedColours.length > 0) {
    liveKeyParts.push(`colors^${selectedColours.map(c => c.toLowerCase()).join(',')}`);
  }
  if (selectedMaterials.length > 0) {
    liveKeyParts.push(`materials^${selectedMaterials.map(m => m.toLowerCase()).join(',')}`);
  }
  if (selectedPatterns.length > 0) {
    liveKeyParts.push(`patterns^${selectedPatterns.map(p => p.toLowerCase()).join(',')}`);
  }
  if (selectedSegments.length > 0) {
    liveKeyParts.push(`segments^${selectedSegments.map(s => s.toLowerCase()).join(',')}`);
  }
  if (selectedSubCategories.length > 0) {
    liveKeyParts.push(`subcategories^${selectedSubCategories.map(sc => sc.toLowerCase()).join(',')}`);
  }
  const liveKey = liveKeyParts.join('|');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Filter Page SEO changes saved successfully!');
      router.push('/filter-page-seo');
    }, 600);
  };

  return (
    <div className="space-y-6 pt-2 pb-20 max-w-5xl mx-auto">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/manage-product" className="hover:text-slate-900">
          Home
        </Link>
        <span>/</span>
        <Link href="/filter-page-seo" className="hover:text-slate-900">
          Filter Page Seo
        </Link>
        <span>/</span>
        <span>Update</span>
        <span>/</span>
        <span className="bg-[#1f2438] text-white px-2.5 py-0.5 rounded-full font-bold text-[10px]">
          {id}
        </span>
      </div>

      {/* FLOATING HEADER CARD */}
      <div className="bg-[#f0f4f9]/80 backdrop-blur-sm p-6 rounded-3xl border border-slate-200/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#e0ebf8] flex items-center justify-center text-xl shadow-2xs">
            🔎
          </div>
          <div>
            <h1 className="text-base font-bold text-[#1f2438]">Edit Filter Page SEO</h1>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <span>Tweak the metadata for this filter combo</span>
              <span>✏️</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1f2438] text-white text-xs font-semibold hover:bg-black transition-colors self-start sm:self-auto shadow-xs"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>How it works</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: PRODUCT TYPE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🧵</span>
            <h2 className="text-xs font-bold text-[#1f2438] uppercase tracking-wide">
              Product Type
            </h2>
            <Info className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setProductType('Fabric')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                productType === 'Fabric'
                  ? 'bg-white border-[#585c82] text-slate-900 shadow-xs ring-2 ring-[#585c82]/10'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white'
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  productType === 'Fabric' ? 'bg-[#585c82]' : 'bg-slate-300'
                }`}
              />
              <span>Fabric</span>
            </button>

            <button
              type="button"
              onClick={() => setProductType('Finished')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                productType === 'Finished'
                  ? 'bg-white border-[#585c82] text-slate-900 shadow-xs ring-2 ring-[#585c82]/10'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white'
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  productType === 'Finished' ? 'bg-[#585c82]' : 'bg-slate-300'
                }`}
              />
              <span>Finished</span>
            </button>
          </div>
        </div>

        {/* SECTION 2: FILTER PERMUTATION */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 text-base">✳️</span>
              <h2 className="text-xs font-bold text-[#1f2438] uppercase tracking-wide">
                Filter Permutation
              </h2>
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <a
              href="#"
              className="text-xs text-[#585c82] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Learn more</span>
              <span>→</span>
            </a>
          </div>

          {/* 6-BOX GRID MATRIX */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. COLOUR */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between h-72 shadow-2xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#1f2438]">Colour</span>
                  <span className="w-5 h-5 rounded-full bg-[#ebeff8] text-[#585c82] flex items-center justify-center font-bold text-[10px]">
                    {selectedColours.length}
                  </span>
                </div>

                {/* SELECTED PILLS */}
                <div className="flex flex-wrap gap-1.5 min-h-[26px]">
                  {selectedColours.map(c => (
                    <span
                      key={c}
                      onClick={() => toggleSelection(selectedColours, setSelectedColours, c)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ebeff8] text-[#585c82] text-[10px] font-semibold rounded-md cursor-pointer hover:bg-rose-100 hover:text-rose-700 transition-colors"
                    >
                      <span>{c}</span>
                      <span>×</span>
                    </span>
                  ))}
                </div>

                {/* SEARCH */}
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search colour..."
                    value={colourSearch}
                    onChange={e => setColourSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-[#585c82]"
                  />
                </div>
              </div>

              {/* LIST */}
              <div className="overflow-y-auto space-y-1 pr-1 flex-1 mt-2 text-xs">
                {colourOptions
                  .filter(c => !colourSearch || c.name.toLowerCase().includes(colourSearch.toLowerCase()))
                  .map(c => {
                    const checked = selectedColours.includes(c.name);
                    return (
                      <div
                        key={c.name}
                        onClick={() => toggleSelection(selectedColours, setSelectedColours, c.name)}
                        className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700"
                      >
                        <label className="flex items-center gap-2 cursor-pointer pointer-events-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            readOnly
                            className="rounded border-slate-300 text-[#585c82] focus:ring-0"
                          />
                          <span className="text-[11px] font-medium">{c.name}</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">{c.count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 2. MATERIAL */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between h-72 shadow-2xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#1f2438]">Material</span>
                  <span className="w-5 h-5 rounded-full bg-[#ebeff8] text-[#585c82] flex items-center justify-center font-bold text-[10px]">
                    {selectedMaterials.length}
                  </span>
                </div>

                {/* SELECTED PILLS */}
                <div className="flex flex-wrap gap-1.5 min-h-[26px]">
                  {selectedMaterials.map(m => (
                    <span
                      key={m}
                      onClick={() => toggleSelection(selectedMaterials, setSelectedMaterials, m)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ebeff8] text-[#585c82] text-[10px] font-semibold rounded-md cursor-pointer hover:bg-rose-100 hover:text-rose-700 transition-colors"
                    >
                      <span>{m}</span>
                      <span>×</span>
                    </span>
                  ))}
                </div>

                {/* SEARCH */}
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search material..."
                    value={materialSearch}
                    onChange={e => setMaterialSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-[#585c82]"
                  />
                </div>
              </div>

              {/* LIST */}
              <div className="overflow-y-auto space-y-1 pr-1 flex-1 mt-2 text-xs">
                {materialOptions
                  .filter(m => !materialSearch || m.name.toLowerCase().includes(materialSearch.toLowerCase()))
                  .map(m => {
                    const checked = selectedMaterials.includes(m.name);
                    return (
                      <div
                        key={m.name}
                        onClick={() => toggleSelection(selectedMaterials, setSelectedMaterials, m.name)}
                        className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700"
                      >
                        <label className="flex items-center gap-2 cursor-pointer pointer-events-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            readOnly
                            className="rounded border-slate-300 text-[#585c82] focus:ring-0"
                          />
                          <span className="text-[11px] font-medium">{m.name}</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">{m.count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 3. PATTERN */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between h-72 shadow-2xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#1f2438]">Pattern</span>
                  <span className="w-5 h-5 rounded-full bg-[#ebeff8] text-[#585c82] flex items-center justify-center font-bold text-[10px]">
                    {selectedPatterns.length}
                  </span>
                </div>

                {/* SELECTED PILLS */}
                <div className="flex flex-wrap gap-1.5 min-h-[26px]">
                  {selectedPatterns.map(p => (
                    <span
                      key={p}
                      onClick={() => toggleSelection(selectedPatterns, setSelectedPatterns, p)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ebeff8] text-[#585c82] text-[10px] font-semibold rounded-md cursor-pointer hover:bg-rose-100 hover:text-rose-700 transition-colors"
                    >
                      <span>{p}</span>
                      <span>×</span>
                    </span>
                  ))}
                </div>

                {/* SEARCH */}
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search pattern..."
                    value={patternSearch}
                    onChange={e => setPatternSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-[#585c82]"
                  />
                </div>
              </div>

              {/* LIST */}
              <div className="overflow-y-auto space-y-1 pr-1 flex-1 mt-2 text-xs">
                {patternOptions
                  .filter(p => !patternSearch || p.name.toLowerCase().includes(patternSearch.toLowerCase()))
                  .map(p => {
                    const checked = selectedPatterns.includes(p.name);
                    return (
                      <div
                        key={p.name}
                        onClick={() => toggleSelection(selectedPatterns, setSelectedPatterns, p.name)}
                        className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700"
                      >
                        <label className="flex items-center gap-2 cursor-pointer pointer-events-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            readOnly
                            className="rounded border-slate-300 text-[#585c82] focus:ring-0"
                          />
                          <span className="text-[11px] font-medium">{p.name}</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">{p.count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 4. SEGMENT */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between h-72 shadow-2xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#1f2438]">Segment</span>
                  <span className="w-5 h-5 rounded-full bg-[#ebeff8] text-[#585c82] flex items-center justify-center font-bold text-[10px]">
                    {selectedSegments.length}
                  </span>
                </div>

                {/* SELECTED PILLS */}
                <div className="flex flex-wrap gap-1.5 min-h-[26px]">
                  {selectedSegments.map(s => (
                    <span
                      key={s}
                      onClick={() => toggleSelection(selectedSegments, setSelectedSegments, s)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ebeff8] text-[#585c82] text-[10px] font-semibold rounded-md cursor-pointer hover:bg-rose-100 hover:text-rose-700 transition-colors"
                    >
                      <span>{s}</span>
                      <span>×</span>
                    </span>
                  ))}
                </div>

                {/* SEARCH */}
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search segment..."
                    value={segmentSearch}
                    onChange={e => setSegmentSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-[#585c82]"
                  />
                </div>
              </div>

              {/* LIST */}
              <div className="overflow-y-auto space-y-1 pr-1 flex-1 mt-2 text-xs">
                {segmentOptions
                  .filter(s => !segmentSearch || s.name.toLowerCase().includes(segmentSearch.toLowerCase()))
                  .map(s => {
                    const checked = selectedSegments.includes(s.name);
                    return (
                      <div
                        key={s.name}
                        onClick={() => toggleSelection(selectedSegments, setSelectedSegments, s.name)}
                        className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700"
                      >
                        <label className="flex items-center gap-2 cursor-pointer pointer-events-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            readOnly
                            className="rounded border-slate-300 text-[#585c82] focus:ring-0"
                          />
                          <span className="text-[11px] font-medium truncate max-w-[120px]">{s.name}</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">{s.count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 5. SUB-CATEGORY */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between h-72 shadow-2xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#1f2438]">Sub-category</span>
                  <span className="w-5 h-5 rounded-full bg-[#ebeff8] text-[#585c82] flex items-center justify-center font-bold text-[10px]">
                    {selectedSubCategories.length}
                  </span>
                </div>

                {/* SELECTED PILLS */}
                <div className="flex flex-wrap gap-1.5 min-h-[26px]">
                  {selectedSubCategories.map(sc => (
                    <span
                      key={sc}
                      onClick={() => toggleSelection(selectedSubCategories, setSelectedSubCategories, sc)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ebeff8] text-[#585c82] text-[10px] font-semibold rounded-md cursor-pointer hover:bg-rose-100 hover:text-rose-700 transition-colors"
                    >
                      <span>{sc}</span>
                      <span>×</span>
                    </span>
                  ))}
                </div>

                {/* SEARCH */}
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search sub-category..."
                    value={subCategorySearch}
                    onChange={e => setSubCategorySearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-[#585c82]"
                  />
                </div>
              </div>

              {/* LIST */}
              <div className="overflow-y-auto space-y-1 pr-1 flex-1 mt-2 text-xs">
                {subCategoryOptions
                  .filter(sc => !subCategorySearch || sc.name.toLowerCase().includes(subCategorySearch.toLowerCase()))
                  .map(sc => {
                    const checked = selectedSubCategories.includes(sc.name);
                    return (
                      <div
                        key={sc.name}
                        onClick={() => toggleSelection(selectedSubCategories, setSelectedSubCategories, sc.name)}
                        className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700"
                      >
                        <label className="flex items-center gap-2 cursor-pointer pointer-events-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            readOnly
                            className="rounded border-slate-300 text-[#585c82] focus:ring-0"
                          />
                          <span className="text-[11px] font-medium truncate max-w-[120px]">{sc.name}</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">{sc.count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 6. RANGES & STOCK */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between h-72 shadow-2xs space-y-3">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-[#1f2438]">Ranges &amp; Stock</span>
              </div>

              <div className="space-y-2 text-[11px]">
                {/* PRICE */}
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 block mb-1">● Price</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Min"
                      value={minPrice}
                      onChange={e => setMinPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:bg-white"
                    />
                    <span className="text-slate-400">—</span>
                    <input
                      type="text"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={e => setMaxPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:bg-white"
                    />
                  </div>
                </div>

                {/* GSM */}
                <div>
                  <span className="text-[10px] font-bold text-[#585c82] block mb-1">● GSM</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Min"
                      value={minGsm}
                      onChange={e => setMinGsm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:bg-white"
                    />
                    <span className="text-slate-400">—</span>
                    <input
                      type="text"
                      placeholder="Max"
                      value={maxGsm}
                      onChange={e => setMaxGsm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:bg-white"
                    />
                  </div>
                </div>

                {/* AVAILABILITY */}
                <div>
                  <span className="text-[10px] font-bold text-amber-600 block mb-1">● Availability</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Min"
                      value={minAvailability}
                      onChange={e => setMinAvailability(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:bg-white"
                    />
                    <span className="text-slate-400">—</span>
                    <input
                      type="text"
                      placeholder="Max"
                      value={maxAvailability}
                      onChange={e => setMaxAvailability(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* IN STOCK ONLY TOGGLE */}
              <div className="pt-1 flex items-center justify-end gap-2 text-xs">
                <input
                  type="checkbox"
                  id="inStockOnly"
                  checked={inStockOnly}
                  onChange={e => setInStockOnly(e.target.checked)}
                  className="rounded border-slate-300 text-[#585c82] focus:ring-0"
                />
                <label htmlFor="inStockOnly" className="text-[11px] font-medium text-slate-700 cursor-pointer">
                  In stock only
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: LIVE KEY TERMINAL DISPLAY */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
            <span>⚡</span>
            <span>LIVE KEY</span>
          </div>
          <div className="bg-[#0f172a] text-slate-200 font-mono text-[11px] px-4 py-3 rounded-2xl break-all shadow-inner border border-slate-800">
            {liveKey || 'colors^beige,brown|materials^cotton,linen|patterns^check|segments^dyed plain weaves|subcategories^handwoven linen'}
          </div>
        </div>

        {/* SECTION 4: PAGE METADATA */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-5">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 text-base">✨</span>
            <h2 className="text-xs font-bold text-[#1f2438] uppercase tracking-wide">
              Page Metadata
            </h2>
          </div>

          <div className="space-y-4">
            {/* PAGE TITLE */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <span>Page Title</span>
                  <span className="text-rose-500">*</span>
                  <Info className="w-3 h-3 text-slate-400 ml-1" />
                </label>
              </div>
              <input
                type="text"
                required
                value={pageTitle}
                onChange={e => setPageTitle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
              />
            </div>

            {/* META TITLE */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <span>Meta Title</span>
                  <span className="text-rose-500">*</span>
                  <Info className="w-3 h-3 text-slate-400 ml-1" />
                </label>
                <span className="text-[10px] font-bold text-rose-500">
                  {metaTitle.length}/60
                </span>
              </div>
              <input
                type="text"
                required
                value={metaTitle}
                onChange={e => setMetaTitle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
              />
            </div>

            {/* META DESCRIPTION */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <span>Meta Description</span>
                  <span className="text-rose-500">*</span>
                  <Info className="w-3 h-3 text-slate-400 ml-1" />
                </label>
                <span className="text-[10px] font-bold text-rose-500">
                  {metaDescription.length}/165
                </span>
              </div>
              <textarea
                rows={3}
                required
                value={metaDescription}
                onChange={e => setMetaDescription(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82] leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: BANNER */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🖼️</span>
            <h2 className="text-xs font-bold text-[#1f2438] uppercase tracking-wide">
              Banner
            </h2>
            <Info className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Banner Image
              </label>
              <div className="border border-slate-300 rounded-lg p-2 bg-[#f4f4f5] flex items-center justify-between max-w-sm">
                <label className="cursor-pointer inline-flex items-center px-3 py-1 bg-[#e4e4e7] border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-200">
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setBannerImage(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-slate-500 ml-3 flex-1 truncate">
                  {bannerImage ? 'Image selected' : 'No file chosen'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Banner Heading
              </label>
              <input
                type="text"
                value={bannerHeading}
                onChange={e => setBannerHeading(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#585c82]"
              />
            </div>
          </div>
        </div>

        {/* SECTION 6: STATUS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🚦</span>
            <h2 className="text-xs font-bold text-[#1f2438] uppercase tracking-wide">
              Status
            </h2>
            <Info className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                isActive ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-xs font-semibold text-slate-800">
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="flex items-center justify-center gap-6 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-72 py-2.5 text-xs font-semibold text-white bg-[#6e62e5] hover:bg-[#5b4fd8] rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>💾 Save Changes</span>
          </button>

          <button
            type="button"
            onClick={() => router.push('/filter-page-seo')}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

