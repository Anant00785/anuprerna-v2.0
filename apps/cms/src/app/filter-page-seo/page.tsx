'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import { Plus, Search, RefreshCw, Loader2, Edit2, Trash2, Globe, CheckCircle2, AlertTriangle, FileText, Copy, ExternalLink, X, Check } from 'lucide-react';
import { SeoService, FilterPageSeoItem } from '@/services/seo-service';

export default function FilterPageSeoPage() {
  const [seoItems, setSeoItems] = useState<FilterPageSeoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'category' | 'material' | 'color' | 'pattern' | 'tag'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FilterPageSeoItem | null>(null);

  // Form State
  const [pageType, setPageType] = useState<FilterPageSeoItem['pageType']>('category');
  const [targetFacetName, setTargetFacetName] = useState('');
  const [routePath, setRoutePath] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [isIndexed, setIsIndexed] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await SeoService.getFilterSeoList();
      setSeoItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load filter page SEO configurations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered list
  const filtered = seoItems.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (item.targetFacetName || '').toLowerCase().includes(term) ||
      (item.routePath || '').toLowerCase().includes(term) ||
      (item.metaTitle || '').toLowerCase().includes(term) ||
      (item.metaKeywords || '').toLowerCase().includes(term);

    let matchesTab = true;
    if (activeTab === 'category') matchesTab = ['category', 'segment', 'sub-category'].includes(item.pageType);
    else if (activeTab === 'material') matchesTab = item.pageType === 'material';
    else if (activeTab === 'color') matchesTab = item.pageType === 'color';
    else if (activeTab === 'pattern') matchesTab = item.pageType === 'pattern';
    else if (activeTab === 'tag') matchesTab = item.pageType === 'tag';

    return matchesSearch && matchesTab;
  });

  // Metrics
  const statsTotal = seoItems.length;
  const statsSeoComplete = seoItems.filter(i => (i.metaTitle || '').length > 20 && (i.metaDescription || '').length > 80).length;
  const statsNeedsCopy = seoItems.filter(i => !(i.metaDescription) || i.metaDescription.length < 80).length;
  const statsIndexed = seoItems.filter(i => i.isIndexed).length;

  const openAddModal = () => {
    setEditingItem(null);
    setPageType('category');
    setTargetFacetName('');
    setRoutePath('');
    setMetaTitle('');
    setMetaDescription('');
    setMetaKeywords('');
    setCanonicalUrl('');
    setOgImage('');
    setIsIndexed(true);
    setModalOpen(true);
  };

  const openEditModal = (item: FilterPageSeoItem) => {
    setEditingItem(item);
    setPageType(item.pageType);
    setTargetFacetName(item.targetFacetName || '');
    setRoutePath(item.routePath || '');
    setMetaTitle(item.metaTitle || '');
    setMetaDescription(item.metaDescription || '');
    setMetaKeywords(item.metaKeywords || '');
    setCanonicalUrl(item.canonicalUrl || '');
    setOgImage(item.ogImage || '');
    setIsIndexed(item.isIndexed ?? true);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFacetName.trim() || !routePath.trim() || !metaTitle.trim()) return;
    setSubmitting(true);
    try {
      const payload: Partial<FilterPageSeoItem> = {
        id: editingItem ? editingItem.id : Date.now(),
        pageType,
        targetFacetName: targetFacetName.trim(),
        routePath: routePath.trim(),
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
        metaKeywords: metaKeywords.trim(),
        canonicalUrl: canonicalUrl.trim(),
        ogImage: ogImage.trim(),
        isIndexed,
        score: Math.min(100, Math.floor((metaTitle.length / 60) * 40 + (metaDescription.length / 160) * 60)),
        updatedAt: Date.now(),
      };

      await SeoService.createOrUpdateFilterSeo(payload);

      if (editingItem) {
        setSeoItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...payload } as FilterPageSeoItem : i));
      } else {
        setSeoItems(prev => [payload as FilterPageSeoItem, ...prev]);
      }

      setModalOpen(false);
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
      await SeoService.deleteFilterSeo(deletingId);
      setSeoItems(prev => prev.filter(i => i.id !== deletingId));
      setDeletingId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete SEO entry');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <PageHeading heading="Filter Page SEO" />
          <p className="text-xs text-slate-500">
            Configure Meta Titles, Meta Descriptions, Keywords, Canonical URLs, and Social OG tags for fabric and product filter landing pages
          </p>
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
            <span>Add Filter SEO</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{statsTotal}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CONFIGURED PAGES</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{statsSeoComplete}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SEO COMPLETE</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600">{statsNeedsCopy}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NEEDS DESCRIPTIONS</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-indigo-600">{statsIndexed}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">INDEXED URLS</div>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
            {[
              { id: 'all', label: 'All Facets' },
              { id: 'category', label: 'Categories' },
              { id: 'material', label: 'Materials' },
              { id: 'color', label: 'Colors' },
              { id: 'pattern', label: 'Patterns' },
              { id: 'tag', label: 'Special Tags' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 w-full sm:w-72 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by route, facet or keywords..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-400"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Loading filter page SEO settings...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">TARGET FACET / ROUTE</th>
                  <th className="px-6 py-3.5">META TITLE</th>
                  <th className="px-6 py-3.5">META DESCRIPTION</th>
                  <th className="px-6 py-3.5">KEYWORDS</th>
                  <th className="px-6 py-3.5">STATUS</th>
                  <th className="px-6 py-3.5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No filter page SEO configurations found.
                    </td>
                  </tr>
                ) : (
                  filtered.map(item => {
                    const keywordsList = (item.metaKeywords || '').split(',').map(k => k.trim()).filter(Boolean);
                    const descLen = (item.metaDescription || '').length;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 text-sm block">{item.targetFacetName}</span>
                            <code className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                              {item.routePath}
                            </code>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="font-semibold text-xs text-slate-800 line-clamp-2">{item.metaTitle}</p>
                          <span className="text-[10px] text-slate-400">{item.metaTitle?.length || 0}/60 chars</span>
                        </td>
                        <td className="px-6 py-4 max-w-sm">
                          <p className="text-xs text-slate-600 line-clamp-2">{item.metaDescription || 'No meta description set.'}</p>
                          <span className={`text-[10px] font-bold ${descLen >= 120 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {descLen}/160 chars
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {keywordsList.slice(0, 3).map((kw, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-md">
                                {kw}
                              </span>
                            ))}
                            {keywordsList.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-bold">+{keywordsList.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            item.isIndexed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.isIndexed ? 'INDEXED' : 'NOINDEX'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`https://anuprerna.com${item.routePath}`);
                                alert('Canonical URL copied to clipboard!');
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                              title="Copy URL"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                              title="Edit SEO Config"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete SEO Config"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit SEO Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">{editingItem ? 'Edit Filter Page SEO' : 'Add Filter Page SEO'}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Facet Category *</label>
                <select
                  value={pageType}
                  onChange={e => setPageType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
                >
                  <option value="category">Category</option>
                  <option value="material">Material / Fabric</option>
                  <option value="color">Color</option>
                  <option value="pattern">Pattern / Weave</option>
                  <option value="tag">Special Status / Tag</option>
                  <option value="custom">Custom Facet Landing</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Target Facet Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Cotton, Jamdani Weave"
                  value={targetFacetName}
                  onChange={e => setTargetFacetName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Route Path *</label>
              <input
                type="text"
                required
                placeholder="e.g. /material/organic-cotton"
                value={routePath}
                onChange={e => setRoutePath(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Meta Title *</label>
                <span className={`text-[10px] font-bold ${metaTitle.length <= 60 ? 'text-slate-400' : 'text-amber-600'}`}>
                  {metaTitle.length}/60 chars
                </span>
              </div>
              <input
                type="text"
                required
                placeholder="Target SEO page title tags..."
                value={metaTitle}
                onChange={e => setMetaTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Meta Description</label>
                <span className={`text-[10px] font-bold ${metaDescription.length <= 160 ? 'text-slate-400' : 'text-amber-600'}`}>
                  {metaDescription.length}/160 chars
                </span>
              </div>
              <textarea
                rows={3}
                placeholder="Compelling meta description summary for search engine snippets..."
                value={metaDescription}
                onChange={e => setMetaDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Target Keywords (Comma Separated)</label>
              <input
                type="text"
                placeholder="e.g. organic cotton, wholesale fabric, GOTS certified"
                value={metaKeywords}
                onChange={e => setMetaKeywords(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Canonical URL</label>
                <input
                  type="text"
                  placeholder="https://anuprerna.com/material/..."
                  value={canonicalUrl}
                  onChange={e => setCanonicalUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">OpenGraph Image URL</label>
                <input
                  type="text"
                  placeholder="https://.../social-og.jpg"
                  value={ogImage}
                  onChange={e => setOgImage(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isIndexed"
                checked={isIndexed}
                onChange={e => setIsIndexed(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <label htmlFor="isIndexed" className="text-xs font-semibold text-slate-700">
                Allow Search Engine Indexing (INDEX, FOLLOW)
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm">
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save SEO Config</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete SEO Configuration</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this filter page SEO configuration? This action cannot be undone.
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
