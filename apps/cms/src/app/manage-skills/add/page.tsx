'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Award } from 'lucide-react';
import { SkillService, Skill } from '@/services/skill-service';

export default function CreateSkillPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [existingNames, setExistingNames] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    SkillService.getSkills()
      .then(skills => setExistingNames(skills.map(s => (s.name || '').trim().toLowerCase())))
      .catch(() => []);
  }, []);

  const isDuplicateName = !!name.trim() && existingNames.includes(name.trim().toLowerCase());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setError('Skill Name is required.');
      return;
    }

    if (isDuplicateName) {
      setError('A skill with this name already exists.');
      return;
    }

    setSubmitting(true);
    try {
      await SkillService.createSkill({
        name: name.trim(),
        description: description.trim(),
      });
      setSuccessMsg('Skill created successfully!');
      setTimeout(() => {
        router.push('/manage-skills');
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Failed to create skill. Please try again.');
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
            <h1 className="text-xl font-bold text-slate-900">Add New Skill</h1>
            <p className="text-xs text-slate-500">Create a new craft skill assignable to artisans</p>
          </div>
        </div>
      </div>

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
            placeholder="e.g. Handloom Weaving, Kantha Embroidery, Dyeing..."
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
              ⚠️ Skill name already exists in catalog.
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            rows={4}
            placeholder="Provide a short explanation of this craft skill..."
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
            <span>{submitting ? 'Creating Skill...' : 'Save & Create Skill'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
