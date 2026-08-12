'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Plus,
  Loader2,
  RefreshCw,
  Edit,
  Trash2,
  X,
  Check,
  BookOpen,
  FolderTree,
} from 'lucide-react';
import { ContentService, StoryPost, StoryCategory } from '@/services/content-service';

type StoryTab = 'STORIES' | 'CATEGORIES';

export default function ManageStoryPage() {
  const [activeTab, setActiveTab] = useState<StoryTab>('STORIES');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [stories, setStories] = useState<StoryPost[]>([]);
  const [categories, setCategories] = useState<StoryCategory[]>([]);

  // Modal State for Category
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [storyContentType, setStoryContentType] = useState('CRAFTS');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [storyData, catData] = await Promise.all([
        ContentService.getStories().catch(() => []),
        ContentService.getStoryCategories().catch(() => []),
      ]);
      setStories(storyData);
      setCategories(catData);
    } catch (err: any) {
      setError(err.message || 'Failed to load story database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredStories = stories.filter(s => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (s.title || '').toLowerCase().includes(q) || (s.storyContentCategory?.name || '').toLowerCase().includes(q);
  });

  const filteredCategories = categories.filter(c => {
    if (!searchTerm.trim()) return true;
    return (c.name || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDeleteStory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this story?')) return;
    try {
      await ContentService.deleteStory(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete story');
    }
  };

  const openAddCategoryModal = () => {
    setEditingId(null);
    setFormName('');
    setStoryContentType('CRAFTS');
    setModalOpen(true);
  };

  const openEditCategoryModal = (cat: StoryCategory) => {
    setEditingId(cat.id);
    setFormName(cat.name || '');
    setStoryContentType(cat.storyContentType || 'CRAFTS');
    setModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await ContentService.updateStoryCategory(editingId, formName, storyContentType);
      } else {
        await ContentService.createStoryCategory(formName, storyContentType);
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
            href="/manage-content"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Artisan Story Studio</h1>
            <p className="text-xs text-slate-500 font-normal">
              Manage artisan narratives, cultural roots &amp; story category taxonomy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {activeTab === 'CATEGORIES' && (
            <button
              onClick={openAddCategoryModal}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Story Category</span>
            </button>
          )}
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Artisan Stories</span>
            <span className="text-2xl font-extrabold text-slate-900">{stories.length}</span>
          </div>
          <BookOpen className="w-6 h-6 text-purple-600" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Story Categories</span>
            <span className="text-2xl font-extrabold text-slate-900">{categories.length}</span>
          </div>
          <FolderTree className="w-6 h-6 text-emerald-600" />
        </div>
      </div>

      {/* SEARCH AND TABS */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96 flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search story narratives or categories..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-end sm:self-auto">
          <button
            onClick={() => setActiveTab('STORIES')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'STORIES' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stories ({stories.length})
          </button>
          <button
            onClick={() => setActiveTab('CATEGORIES')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'CATEGORIES' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Categories ({categories.length})
          </button>
        </div>
      </div>

      {/* CONTENT TABLE */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading artisan story database...</p>
        </div>
      ) : activeTab === 'STORIES' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Story Title</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      No stories found.
                    </td>
                  </tr>
                ) : (
                  filteredStories.map(story => (
                    <tr key={story.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{story.title}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-purple-600">
                        {story.storyContentCategory?.name || 'Heritage'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {story.timeOfCreation ? new Date(story.timeOfCreation).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteStory(story.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Category Name</th>
                  <th className="px-6 py-3.5">Content Type</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                      No story categories defined yet.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map(cat => (
                    <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{cat.name}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                        {cat.storyContentType || 'CRAFTS'}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => openEditCategoryModal(cat)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL FOR ADDING / EDITING STORY CATEGORY */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCategory}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingId ? 'Edit' : 'Add'} Story Category
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic & Natural, Kantha Weaving..."
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Content Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={storyContentType}
                  onChange={e => setStoryContentType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="CRAFTS">CRAFTS</option>
                  <option value="ARTISTS">ARTISTS</option>
                  <option value="COLLABORATIONS">COLLABORATIONS</option>
                  <option value="PROCESS">PROCESS</option>
                </select>
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
