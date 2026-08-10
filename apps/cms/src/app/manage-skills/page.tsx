'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Loader2, RefreshCw, Plus, Edit, Trash2, X, Check, Award } from 'lucide-react';
import { SkillService, Skill } from '@/services/skill-service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const RECENT_WINDOW_DAYS = 30;

const COLOR_VARIANTS = [
  'bg-rose-50/80 border-rose-200 text-rose-950',
  'bg-emerald-50/80 border-emerald-200 text-emerald-950',
  'bg-purple-50/80 border-purple-200 text-purple-950',
  'bg-sky-50/80 border-sky-200 text-sky-950',
  'bg-amber-50/80 border-amber-200 text-amber-950',
];

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp || timestamp <= 0) return '';
  const diffMs = Date.now() - timestamp;
  const days = Math.max(0, Math.floor(diffMs / MS_PER_DAY));

  if (days < 1) return 'today';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

export default function ManageSkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Delete modal state
  const [deletingSkill, setDeletingSkill] = useState<Skill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSkills = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await SkillService.getSkills();
      setSkills(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load skills list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const filteredSkills = skills.filter(s => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (s.name || '').toLowerCase().includes(term) || (s.description || '').toLowerCase().includes(term);
  });

  const threshold = Date.now() - RECENT_WINDOW_DAYS * MS_PER_DAY;
  const statsTotal = skills.length;
  const statsNewThisMonth = skills.filter(s => (s.timeOfCreation ?? 0) > threshold).length;
  const statsUpdatedRecently = skills.filter(
    s => (s.lastUpdateTime ?? 0) > 0 && (s.lastUpdateTime ?? 0) > threshold
  ).length;
  const statsWithDescription = skills.filter(s => !!(s.description && s.description.trim().length > 0)).length;

  const handleDeleteConfirm = async () => {
    if (!deletingSkill?.id) return;
    setIsDeleting(true);
    try {
      await SkillService.deleteSkill(deletingSkill.id);
      setDeletingSkill(null);
      fetchSkills();
    } catch (err: any) {
      alert(err.message || 'Failed to delete skill.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎓</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Skill Management</h1>
            <p className="text-sm text-slate-500 font-normal">
              The catalog of craft expertise — assignable to artisans
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSkills}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/manage-artisans"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm"
          >
            <span>👨‍🎨</span>
            <span>Artisans</span>
          </Link>
          <Link
            href="/manage-skills/add"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Skill</span>
          </Link>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            <span className="text-2xl font-extrabold text-slate-900">{statsTotal}</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🆕</span>
            <span className="text-2xl font-extrabold text-slate-900">{statsNewThisMonth}</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">New This Month</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">✏️</span>
            <span className="text-2xl font-extrabold text-slate-900">{statsUpdatedRecently}</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Updated Recently</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <span className="text-2xl font-extrabold text-slate-900">{statsWithDescription}</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">With Description</span>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search skills by name or description..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-sm placeholder:text-slate-400"
        />
      </div>

      {/* CONTENT AREA */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading skill catalog...</p>
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center gap-3">
          <span className="text-3xl">🎓</span>
          <div>
            <p className="font-semibold text-slate-800">
              {searchTerm ? `No skills match "${searchTerm}"` : 'No skills found'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm ? 'Try a different search query' : 'Build your craft catalog by adding the first skill.'}
            </p>
          </div>
          {!searchTerm && (
            <Link
              href="/manage-skills/add"
              className="mt-2 flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Skill</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredSkills.map(skill => {
            const cardBg = COLOR_VARIANTS[(skill.id || 0) % COLOR_VARIANTS.length];
            const emoji = SkillService.resolveEmoji(skill.name);
            const isUpdated = (skill.lastUpdateTime ?? 0) > (skill.timeOfCreation ?? 0);
            const recencyTime = isUpdated
              ? formatRelativeTime(skill.lastUpdateTime)
              : formatRelativeTime(skill.timeOfCreation);
            const recencyText = recencyTime ? `${isUpdated ? 'Updated' : 'Added'} ${recencyTime} ago` : '';

            return (
              <div
                key={skill.id}
                className={`p-5 rounded-xl border shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${cardBg}`}
              >
                <div className="space-y-2">
                  <div className="text-3xl">{emoji}</div>
                  <h3 className="font-extrabold text-base leading-snug">{skill.name}</h3>
                  <p className="text-xs opacity-80 line-clamp-3 leading-relaxed">
                    {skill.description?.trim() ? skill.description : 'No description yet'}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-900/10 flex items-center justify-between text-xs">
                  <span className="text-[11px] opacity-70 font-medium">{recencyText || 'Craft Skill'}</span>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/manage-skills/update/${skill.id}`}
                      title="Edit Skill"
                      className="p-1.5 rounded-md hover:bg-slate-900/10 transition-colors opacity-80 hover:opacity-100"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => setDeletingSkill(skill)}
                      title="Delete Skill"
                      className="p-1.5 rounded-md hover:bg-rose-500/20 text-rose-700 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingSkill && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Delete Skill</h3>
              <button
                onClick={() => setDeletingSkill(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to delete the skill <strong className="text-slate-900">&quot;{deletingSkill.name}&quot;</strong>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingSkill(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-all shadow-sm"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Skill'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
