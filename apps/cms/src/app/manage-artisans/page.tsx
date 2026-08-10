'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Loader2,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Download,
  ChevronDown,
  Plus,
  SlidersHorizontal,
  X,
  Check,
  Award,
} from 'lucide-react';
import { ArtisanService, Artisan, ArtisanSkill } from '@/services/artisan-service';

type RoleFilter = 'ALL' | 'MASTER' | 'WORKER';
type TabKey = 'ALL' | 'MASTERS' | 'WORKERS' | 'CATALOGS';

export default function ManageArtisansPage() {
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedTab, setSelectedTab] = useState<TabKey>('ALL');
  const [filterRole, setFilterRole] = useState<RoleFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Skills Modal State
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [selectedArtisanForSkills, setSelectedArtisanForSkills] = useState<Artisan | null>(null);
  const [allSkills, setAllSkills] = useState<ArtisanSkill[]>([]);
  const [selectedSkillIdsModal, setSelectedSkillIdsModal] = useState<number[]>([]);
  const [savingSkills, setSavingSkills] = useState(false);

  const fetchArtisans = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ArtisanService.getArtisans(true);
      setArtisans(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load artisans from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtisans();
    ArtisanService.getSkills().then(setAllSkills).catch(() => []);
  }, []);

  const activeArtisans = artisans.filter(a => a.active);

  const matchesSearch = (artisan: Artisan): boolean => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name = (artisan.name || '').toLowerCase();
    const phone = (artisan.contactNumber || '').toLowerCase();
    const district = (artisan.district || '').toLowerCase();
    const state = (artisan.state || '').toLowerCase();
    return name.includes(term) || phone.includes(term) || district.includes(term) || state.includes(term);
  };

  const matchesRoleFilter = (artisan: Artisan): boolean => {
    if (filterRole === 'ALL') return true;
    return artisan.artisanRole === filterRole;
  };

  const filteredArtisans = artisans.filter(a => matchesRoleFilter(a) && matchesSearch(a));
  const masterArtisans = artisans.filter(a => a.artisanRole === 'MASTER' && matchesSearch(a));
  const workerArtisans = artisans.filter(a => a.artisanRole === 'WORKER' && matchesSearch(a));
  const artisansWithCatalogs = artisans.filter(a => (a.catalogCount ?? 0) > 0 && matchesSearch(a));

  const getCurrentTabArtisans = (): Artisan[] => {
    switch (selectedTab) {
      case 'MASTERS':
        return masterArtisans;
      case 'WORKERS':
        return workerArtisans;
      case 'CATALOGS':
        return artisansWithCatalogs;
      default:
        return filteredArtisans;
    }
  };

  const currentArtisans = getCurrentTabArtisans();

  const statsTotal = activeArtisans.length;
  const statsMasters = activeArtisans.filter(a => a.artisanRole === 'MASTER').length;
  const statsWorkers = activeArtisans.filter(a => a.artisanRole === 'WORKER').length;
  const statsWithCatalogs = activeArtisans.filter(a => (a.catalogCount ?? 0) > 0).length;

  const getInitials = (name: string) => {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarBg = (id: number) => {
    const bgClasses = [
      'bg-indigo-100 text-indigo-700 border-indigo-200',
      'bg-emerald-100 text-emerald-700 border-emerald-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-amber-100 text-amber-700 border-amber-200',
      'bg-rose-100 text-rose-700 border-rose-200',
      'bg-sky-100 text-sky-700 border-sky-200',
    ];
    return bgClasses[id % bgClasses.length];
  };

  const formatLocation = (artisan: Artisan) => {
    const parts = [];
    if (artisan.villageTown) parts.push(artisan.villageTown);
    if (artisan.district) parts.push(artisan.district);
    return parts.join(', ');
  };

  const openManageSkillsModal = (artisan: Artisan) => {
    setSelectedArtisanForSkills(artisan);
    const existingSkillIds = (artisan.skills || [])
      .map(s => s.id)
      .filter((id): id is number => typeof id === 'number');
    setSelectedSkillIdsModal(existingSkillIds);
    setSkillsModalOpen(true);
  };

  const handleSaveSkillsModal = async () => {
    if (!selectedArtisanForSkills) return;
    setSavingSkills(true);
    try {
      await ArtisanService.updateArtisan({
        id: selectedArtisanForSkills.id,
        name: selectedArtisanForSkills.name,
        contactNumber: selectedArtisanForSkills.contactNumber,
        artisanRole: selectedArtisanForSkills.artisanRole,
        masterArtisanId: selectedArtisanForSkills.masterArtisanId,
        skillIds: selectedSkillIdsModal,
        active: selectedArtisanForSkills.active,
      });
      setSkillsModalOpen(false);
      fetchArtisans();
    } catch (err: any) {
      alert(err.message || 'Failed to update skills');
    } finally {
      setSavingSkills(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">👨‍🎨</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Artisan Management</h1>
            <p className="text-sm text-slate-500 font-normal">
              Manage your artisan workforce — masters, workers &amp; their catalogs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchArtisans}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/manage-skills"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm"
          >
            <span>🎓</span>
            <span>Skills</span>
          </Link>
          <Link
            href="/manage-artisans/add"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Artisan</span>
          </Link>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <span className="text-2xl font-extrabold text-slate-900">{statsTotal}</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <span className="text-2xl font-extrabold text-slate-900">{statsMasters}</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Masters</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">👷</span>
            <span className="text-2xl font-extrabold text-slate-900">{statsWorkers}</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Workers</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <span className="text-2xl font-extrabold text-slate-900">{statsWithCatalogs}</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">With Catalog</span>
        </div>
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96 flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search by name or contact number..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-end sm:self-auto">
          <button
            onClick={() => setFilterRole('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              filterRole === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterRole('MASTER')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              filterRole === 'MASTER' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Masters
          </button>
          <button
            onClick={() => setFilterRole('WORKER')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              filterRole === 'WORKER' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Workers
          </button>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      {!loading && !error && (
        <div className="flex items-center gap-6 border-b border-slate-200">
          <button
            onClick={() => setSelectedTab('ALL')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              selectedTab === 'ALL'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>All Artisans</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 font-bold">
              {filteredArtisans.length}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('MASTERS')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              selectedTab === 'MASTERS'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Masters</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 font-bold">
              {masterArtisans.length}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('WORKERS')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              selectedTab === 'WORKERS'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Workers</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 font-bold">
              {workerArtisans.length}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('CATALOGS')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              selectedTab === 'CATALOGS'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>With Catalogs</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 font-bold">
              {artisansWithCatalogs.length}
            </span>
          </button>
        </div>
      )}

      {/* CONTENT AREA */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading artisan roster from backend...</p>
        </div>
      ) : currentArtisans.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center gap-2">
          <span className="text-3xl">🔍</span>
          <p className="font-semibold text-slate-800">No artisans found</p>
          <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Artisan</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Location</th>
                  <th className="px-6 py-3.5">Skills</th>
                  <th className="px-6 py-3.5">Catalogs</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentArtisans.map(artisan => {
                  const visibleSkills = (artisan.skills || []).slice(0, 2);
                  const remainingSkillsCount = Math.max(0, (artisan.skills || []).length - 2);

                  return (
                    <tr key={artisan.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* ARTISAN NAME & AVATAR CELL */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarBg(
                              artisan.id
                            )}`}
                          >
                            {getInitials(artisan.name)}
                          </div>
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900 leading-snug">{artisan.name}</div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {artisan.gender === 'MALE' && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                  ♂ Male
                                </span>
                              )}
                              {artisan.gender === 'FEMALE' && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-pink-50 text-pink-700 border border-pink-200">
                                  ♀ Female
                                </span>
                              )}
                              {artisan.artisanRole === 'MASTER' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  🏆 Master
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  👷 Worker
                                </span>
                              )}
                            </div>
                            {artisan.artisanRole === 'WORKER' && artisan.masterArtisan?.name && (
                              <div className="text-xs text-slate-400 italic">↳ under {artisan.masterArtisan.name}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* CONTACT CELL */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`tel:${artisan.contactNumber}`}
                          className="font-medium text-slate-900 hover:text-indigo-600 transition-colors"
                        >
                          {artisan.contactNumber || '—'}
                        </a>
                        {artisan.hasWhatsapp && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              WhatsApp
                            </span>
                          </div>
                        )}
                      </td>

                      {/* LOCATION CELL */}
                      <td className="px-6 py-4">
                        {formatLocation(artisan) || artisan.state ? (
                          <div className="space-y-0.5">
                            {formatLocation(artisan) && (
                              <div className="text-xs font-semibold text-slate-800 flex items-start gap-1">
                                <span className="text-rose-500 shrink-0">📍</span>
                                <span>{formatLocation(artisan)}</span>
                              </div>
                            )}
                            {artisan.state && <div className="text-xs text-slate-400 pl-4">{artisan.state}</div>}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* SKILLS CELL */}
                      <td className="px-6 py-4">
                        {(artisan.skills || []).length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {visibleSkills.map((skill, sIdx) => (
                              <span
                                key={skill.id || sIdx}
                                className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700"
                              >
                                {skill.name}
                              </span>
                            ))}
                            {remainingSkillsCount > 0 && (
                              <span className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-200 text-slate-700">
                                +{remainingSkillsCount} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* CATALOGS CELL */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/manage-catalog/artisan/${artisan.id}`}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              (artisan.catalogCount ?? 0) > 0
                                ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                                : 'bg-slate-50 text-slate-400 cursor-not-allowed pointer-events-none'
                            }`}
                          >
                            <span>📚</span>
                            <span>{artisan.catalogCount ?? 0}</span>
                          </Link>
                          <button
                            title="Download Catalog PDF"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* STATUS CELL */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {artisan.active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* ACTIONS CELL */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/manage-artisans/detail/${artisan.id}`}
                            title="View Details"
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/manage-artisans/update/${artisan.id}`}
                            title="Edit Artisan"
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => openManageSkillsModal(artisan)}
                            title="Manage Skills"
                            className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Are you sure you want to deactivate ${artisan.name}?`)) {
                                await ArtisanService.deleteArtisan(artisan.id);
                                fetchArtisans();
                              }
                            }}
                            title="Deactivate Artisan"
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MANAGE SKILLS MODAL */}
      {skillsModalOpen && selectedArtisanForSkills && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Award className="w-5 h-5 text-indigo-600" />
                <span>Manage Skills — {selectedArtisanForSkills.name}</span>
              </div>
              <button
                onClick={() => setSkillsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Select Skill Tags
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                {allSkills.map(skill => {
                  const isChecked = selectedSkillIdsModal.includes(skill.id!);
                  return (
                    <label
                      key={skill.id}
                      className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                        isChecked
                          ? 'bg-indigo-50 text-indigo-900 border-indigo-300 font-semibold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedSkillIdsModal(prev =>
                            prev.includes(skill.id!)
                              ? prev.filter(id => id !== skill.id!)
                              : [...prev, skill.id!]
                          );
                        }}
                        className="w-3.5 h-3.5 text-indigo-600 rounded"
                      />
                      <span className="truncate">{skill.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSkillsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSkillsModal}
                disabled={savingSkills}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all shadow-sm"
              >
                {savingSkills ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{savingSkills ? 'Saving...' : 'Save Skills'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
