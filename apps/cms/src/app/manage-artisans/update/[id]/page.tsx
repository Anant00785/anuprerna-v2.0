'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, User, MapPin, Award, CreditCard } from 'lucide-react';
import { ArtisanService, Artisan, ArtisanSkill, UpdateArtisanRequest } from '@/services/artisan-service';

export default function EditArtisanPage() {
  const router = useRouter();
  const params = useParams();
  const artisanId = params?.id ? String(params.id) : '';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [masterArtisans, setMasterArtisans] = useState<Artisan[]>([]);
  const [skillList, setSkillList] = useState<ArtisanSkill[]>([]);

  // Form State
  const [formData, setFormData] = useState<UpdateArtisanRequest>({
    id: 0,
    name: '',
    contactNumber: '',
    artisanRole: 'WORKER',
    masterArtisanId: null,
    skillIds: [],
    gender: 'MALE',
    dob: '',
    hasWhatsapp: false,
    state: '',
    district: '',
    villageTown: '',
    postalCode: '',
    expertise: '',
    experience: 0,
    hasBankAccount: false,
    bankName: '',
    accountHolderName: '',
    ifscCode: '',
    active: true,
  });

  useEffect(() => {
    if (!artisanId) return;

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [artisan, allArtisans, skills] = await Promise.all([
          ArtisanService.getArtisanById(artisanId),
          ArtisanService.getArtisans(true).catch(() => []),
          ArtisanService.getSkills().catch(() => []),
        ]);

        if (!artisan || !artisan.id) {
          setError('Artisan record not found.');
          setLoading(false);
          return;
        }

        setMasterArtisans(allArtisans.filter(a => a.artisanRole === 'MASTER' && a.id !== artisan.id));
        setSkillList(skills);

        const dobVal = artisan.dob
          ? typeof artisan.dob === 'number'
            ? new Date(artisan.dob).toISOString().slice(0, 10)
            : String(artisan.dob).slice(0, 10)
          : '';

        const skillIds = artisan.skillIds?.length
          ? artisan.skillIds
          : (artisan.skills || []).map((s: any) => s.id).filter((x: any) => typeof x === 'number');

        setFormData({
          id: artisan.id,
          name: artisan.name || '',
          contactNumber: artisan.contactNumber || '',
          artisanRole: artisan.artisanRole || 'WORKER',
          masterArtisanId: artisan.masterArtisanId || artisan.masterArtisan?.id || null,
          skillIds: skillIds,
          gender: artisan.gender || 'MALE',
          dob: dobVal,
          hasWhatsapp: !!artisan.hasWhatsapp,
          state: artisan.state || '',
          district: artisan.district || '',
          villageTown: artisan.villageTown || '',
          postalCode: artisan.postalCode || '',
          expertise: artisan.expertise || '',
          experience: artisan.experience || 0,
          hasBankAccount: !!artisan.hasBankAccount,
          bankName: artisan.bankName || '',
          accountHolderName: artisan.accountHolderName || '',
          ifscCode: artisan.ifscCode || '',
          active: artisan.active ?? true,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load artisan details.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [artisanId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSkillToggle = (skillId: number) => {
    setFormData(prev => {
      const current = prev.skillIds || [];
      const updated = current.includes(skillId)
        ? current.filter(id => id !== skillId)
        : [...current, skillId];
      return { ...prev, skillIds: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setError('Artisan Name is required.');
      return;
    }
    if (!formData.contactNumber.trim()) {
      setError('Contact Number is required.');
      return;
    }
    if (formData.artisanRole === 'WORKER' && !formData.masterArtisanId) {
      setError('Please select a Master Artisan for this Worker.');
      return;
    }

    setSubmitting(true);
    try {
      await ArtisanService.updateArtisan({
        ...formData,
        masterArtisanId: formData.artisanRole === 'WORKER' ? Number(formData.masterArtisanId) : null,
        experience: Number(formData.experience) || 0,
      });
      setSuccessMsg('Artisan updated successfully!');
      setTimeout(() => {
        router.push('/manage-artisans');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update artisan details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/manage-artisans"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Edit Artisan</h1>
            <p className="text-xs text-slate-500">Update artisan profile, craft skills &amp; location details</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading artisan details...</p>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECTION 1: ROLE & BASIC INFO */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold text-sm">
                <User className="w-4 h-4 text-indigo-600" />
                <span>Role &amp; Identity</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Artisan Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="artisanRole"
                    value={formData.artisanRole}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                  >
                    <option value="WORKER">Worker Artisan</option>
                    <option value="MASTER">Master Artisan</option>
                  </select>
                </div>

                {formData.artisanRole === 'WORKER' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Assigned Master Artisan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="masterArtisanId"
                      value={formData.masterArtisanId || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                    >
                      <option value="">Select Master Artisan</option>
                      {masterArtisans.map(master => (
                        <option key={master.id} value={master.id}>
                          {master.name} ({master.district || master.state || 'Active Master'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender || 'MALE'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    name="hasWhatsapp"
                    checked={formData.hasWhatsapp || false}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>Has WhatsApp Number</span>
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active || false}
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Active Status</span>
                </label>
              </div>
            </div>

            {/* SECTION 2: LOCATION DETAILS */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold text-sm">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Location &amp; Address</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Village / Town
                  </label>
                  <input
                    type="text"
                    name="villageTown"
                    value={formData.villageTown || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: CRAFT & SKILLS */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold text-sm">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Craft &amp; Associated Skills</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Primary Expertise
                  </label>
                  <input
                    type="text"
                    name="expertise"
                    value={formData.expertise || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience || 0}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Skills
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-lg border border-slate-200">
                  {skillList.map(skill => {
                    const isChecked = (formData.skillIds || []).includes(skill.id!);
                    return (
                      <label
                        key={skill.id}
                        className={`flex items-center gap-2 p-2 rounded-md text-xs font-medium cursor-pointer transition-all border ${
                          isChecked
                            ? 'bg-indigo-50 text-indigo-900 border-indigo-200 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSkillToggle(skill.id!)}
                          className="w-3.5 h-3.5 text-indigo-600 rounded"
                        />
                        <span className="truncate">{skill.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 4: BANK DETAILS */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Bank &amp; Financial Information</span>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="hasBankAccount"
                    checked={formData.hasBankAccount || false}
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Has Bank Account</span>
                </label>
              </div>

              {formData.hasBankAccount && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      name="accountHolderName"
                      value={formData.accountHolderName || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      name="ifscCode"
                      value={formData.ifscCode || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500 uppercase"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SUBMIT BUTTONS */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Link
                href="/manage-artisans"
                className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all shadow-md"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{submitting ? 'Updating Artisan...' : 'Save & Update Artisan'}</span>
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
