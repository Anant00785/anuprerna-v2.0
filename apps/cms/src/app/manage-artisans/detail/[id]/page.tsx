'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Phone,
  MapPin,
  Award,
  CreditCard,
  User,
  BookOpen,
  Loader2,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { ArtisanService, Artisan } from '@/services/artisan-service';

export default function ArtisanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const artisanId = params?.id ? String(params.id) : '';

  const [loading, setLoading] = useState(true);
  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [masterArtisan, setMasterArtisan] = useState<Artisan | null>(null);
  const [workers, setWorkers] = useState<Artisan[]>([]);
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!artisanId) return;

    const loadArtisanDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await ArtisanService.getArtisanById(artisanId);
        setArtisan(data);

        // Fetch master or workers based on role
        if (data.artisanRole === 'WORKER' && (data.masterArtisanId || data.masterArtisan?.id)) {
          const masterId = data.masterArtisanId || data.masterArtisan?.id;
          ArtisanService.getArtisanById(masterId!).then(setMasterArtisan).catch(() => {});
        } else if (data.artisanRole === 'MASTER' && data.id) {
          ArtisanService.getWorkersOfMaster(data.id).then(setWorkers).catch(() => {});
        }

        // Fetch catalog items for this artisan
        if (data.id) {
          ArtisanService.getCatalogListByArtisan(data.id).then(setCatalogs).catch(() => []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load artisan details.');
      } finally {
        setLoading(false);
      }
    };

    loadArtisanDetails();
  }, [artisanId]);

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3 my-8">
        <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading artisan profile...</p>
      </div>
    );
  }

  if (error || !artisan) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 my-8">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl font-medium">
          {error || 'Artisan record not found.'}
        </div>
        <Link
          href="/manage-artisans"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Artisan List</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/manage-artisans"
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-extrabold flex items-center justify-center text-base">
            {artisan.name?.substring(0, 2).toUpperCase() || 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{artisan.name}</h1>
              {artisan.active ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                  Inactive
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="font-semibold text-slate-800">
                {artisan.artisanRole === 'MASTER' ? '🏆 Master Artisan' : '👷 Worker Artisan'}
              </span>
              <span>•</span>
              <span>UID: ART-{artisan.id}</span>
              {artisan.contactNumber && (
                <>
                  <span>•</span>
                  <span>📞 {artisan.contactNumber}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <Link
          href={`/manage-artisans/update/${artisan.id}`}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all shadow-sm self-start sm:self-auto"
        >
          <Edit className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </Link>
      </div>

      {/* GRID DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT COLUMN (2 SPANS) */}
        <div className="md:col-span-2 space-y-6">
          {/* PERSONAL & DEMOGRAPHIC */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold text-sm">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Personal &amp; Demographic Information</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium uppercase tracking-wider block mb-1">Gender</span>
                <span className="font-semibold text-slate-800">{artisan.gender || 'Not specified'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-medium uppercase tracking-wider block mb-1">Date of Birth</span>
                <span className="font-semibold text-slate-800">
                  {artisan.dob
                    ? new Date(typeof artisan.dob === 'number' ? artisan.dob : String(artisan.dob)).toLocaleDateString()
                    : 'Not specified'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium uppercase tracking-wider block mb-1">WhatsApp Reachable</span>
                <span className="font-semibold text-slate-800">
                  {artisan.hasWhatsapp ? 'YES (WhatsApp Enabled)' : 'NO'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium uppercase tracking-wider block mb-1">Account Active</span>
                <span className="font-semibold text-slate-800">{artisan.active ? 'Active' : 'Deactivated'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-medium uppercase tracking-wider block mb-1">Registered Date</span>
                <span className="font-semibold text-slate-800">
                  {artisan.timeOfCreation ? new Date(artisan.timeOfCreation).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* LOCATION */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold text-sm">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>Location Details</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium uppercase tracking-wider block mb-1">Village / Town</span>
                <span className="font-semibold text-slate-800">{artisan.villageTown || 'N/A'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-medium uppercase tracking-wider block mb-1">District</span>
                <span className="font-semibold text-slate-800">{artisan.district || 'N/A'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-medium uppercase tracking-wider block mb-1">State</span>
                <span className="font-semibold text-slate-800">{artisan.state || 'N/A'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-medium uppercase tracking-wider block mb-1">Postal Code</span>
                <span className="font-semibold text-slate-800">{artisan.postalCode || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* CRAFT & SKILLS */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold text-sm">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Craft &amp; Associated Skills</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium uppercase tracking-wider block mb-1">Primary Expertise</span>
                <span className="font-semibold text-slate-800">{artisan.expertise || 'Handloom Craft'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-medium uppercase tracking-wider block mb-1">Experience</span>
                <span className="font-semibold text-slate-800">{artisan.experience || 0} Years</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Associated Skills
              </span>
              {(artisan.skills || []).length === 0 ? (
                <p className="text-xs text-slate-400">No specific skills linked yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {artisan.skills?.map((skill, idx) => (
                    <span
                      key={skill.id || idx}
                      className="px-3 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (1 SPAN) */}
        <div className="space-y-6">
          {/* MASTER OR WORKERS SECTION */}
          {artisan.artisanRole === 'WORKER' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold text-sm">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Assigned Master</span>
              </div>

              {masterArtisan ? (
                <Link
                  href={`/manage-artisans/detail/${masterArtisan.id}`}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3 hover:bg-slate-100 transition-colors block"
                >
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                    {masterArtisan.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{masterArtisan.name}</div>
                    <div className="text-[11px] text-slate-500">🏆 Master Artisan • {masterArtisan.district}</div>
                  </div>
                </Link>
              ) : (
                <p className="text-xs text-slate-400">No master assigned or loading...</p>
              )}
            </div>
          )}

          {artisan.artisanRole === 'MASTER' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Managed Workers</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {workers.length}
                </span>
              </div>

              {workers.length === 0 ? (
                <p className="text-xs text-slate-400">No workers assigned to this master.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {workers.map(w => (
                    <Link
                      key={w.id}
                      href={`/manage-artisans/detail/${w.id}`}
                      className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors text-xs"
                    >
                      <span className="font-semibold text-slate-800">{w.name}</span>
                      <span className="text-slate-400 font-mono text-[10px]">{w.contactNumber}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BANK DETAILS CARD */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold text-sm">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Financial Status</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Bank Account</span>
                <span className="font-bold text-slate-800">
                  {artisan.hasBankAccount ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> None
                    </span>
                  )}
                </span>
              </div>

              {artisan.hasBankAccount && (
                <>
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">Bank Name</span>
                    <span className="font-semibold text-slate-800">{artisan.bankName || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">Holder Name</span>
                    <span className="font-semibold text-slate-800">{artisan.accountHolderName || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400 font-medium">IFSC Code</span>
                    <span className="font-mono font-bold text-slate-800">{artisan.ifscCode || 'N/A'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CATALOGS LINK CARD */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold text-sm">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Catalog Portfolio</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 font-medium">Assigned Catalogs</span>
              <span className="font-extrabold text-slate-900 text-sm">{catalogs.length || artisan.catalogCount || 0}</span>
            </div>

            <Link
              href={`/manage-catalog/artisan/${artisan.id}`}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <span>📚 View Artisan Catalogs</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
