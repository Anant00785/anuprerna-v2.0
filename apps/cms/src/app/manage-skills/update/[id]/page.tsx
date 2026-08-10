'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Award } from 'lucide-react';
import { SkillService, Skill } from '@/services/skill-service';

export default function EditSkillPage() {
  const router = useRouter();
  const params = useParams();
  const skillId = params?.id ? Number(params.id) : 0;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(true);
  const [existingSkills, setExistingSkills] = useState<Skill[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!skillId) return;

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const skills = await SkillService.getSkills();
        setExistingSkills(skills);
        const target = skills.find(s => s.id === skillId);
        if (target) {
          setName(target.name || '');
          setDescription(target.description || '');
        } else {
          setError('Skill not found.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load skill details.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [skillId]);

  const isDuplicateName =
    !!name.trim() &&
    existingSkills
      .filter(s => s.id !== skillId)
      .some(s => (s.name || '').trim().toLowerCase() === name.trim().toLowerCase());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setError('Skill Name is required.');
      return;
    }

    if (isDuplicateName) {
      setError('Another skill with this name already exists.');
      return;
    }

    setSubmitting(true);
    try {
      await SkillService.updateSkill({
        id: skillId,
        name: name.trim(),
        description: description.trim(),
      });
      setSuccessMsg('Skill updated successfully!');
      setTimeout(() => {
        router.push('/manage-skills');
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Failed to update skill details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/manage-skills"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Edit Skill</h1>
            <p className="text-xs text-slate-500">Update skill title &amp; description in craft catalog</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading skill details...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl font-medium">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold text-sm">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Skill Details</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Skill Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-lg outline-none focus:bg-white transition-colors ${
                  isDuplicateName
                    ? 'border-rose-300 focus:border-rose-500 text-rose-900'
                    : 'border-slate-200 focus:border-indigo-500'
                }`}
              />
              {isDuplicateName && (
                <p className="text-xs text-rose-500 font-medium mt-1">
                  ⚠️ Another skill with this name already exists.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Link
                href="/manage-skills"
                className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || isDuplicateName}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{submitting ? 'Updating Skill...' : 'Save & Update Skill'}</span>
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
