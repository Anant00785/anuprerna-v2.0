'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Plus, Loader2, RefreshCw, Edit2, Trash2, X, PlusCircle, Trash } from 'lucide-react';
import { ProfileService, VolumeDiscountProfile, ProfileVolumeConfigItem } from '@/services/profile-service';

export default function VolumeDiscountProfilePage() {
  const [profiles, setProfiles] = useState<VolumeDiscountProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<VolumeDiscountProfile | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete states
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    profileName: string;
    disclaimer: string;
    items: ProfileVolumeConfigItem[];
  }>({
    profileName: '',
    disclaimer: '',
    items: [],
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ProfileService.getVolumeDiscountProfiles();
      setProfiles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load volume discount profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProfile(null);
    setFormData({
      profileName: '',
      disclaimer: '',
      items: [{ minimumOrderQuantity: 10, discount: 5, preOrder: false, advancePayment: 100, deliveryFromDays: 7, deliveryToDays: 14 }],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (profile: VolumeDiscountProfile) => {
    setEditingProfile(profile);
    setIsModalOpen(true);
    try {
      if (profile.id) {
        const fullDetail = await ProfileService.getVolumeDiscountProfileById(profile.id);
        setFormData({
          profileName: fullDetail.profileName || '',
          disclaimer: fullDetail.disclaimer || '',
          items: fullDetail.volumeDiscountProfileItemList && fullDetail.volumeDiscountProfileItemList.length > 0
            ? fullDetail.volumeDiscountProfileItemList
            : [{ minimumOrderQuantity: 10, discount: 5, preOrder: false, advancePayment: 100, deliveryFromDays: 7, deliveryToDays: 14 }],
        });
      }
    } catch {
      setFormData({
        profileName: profile.profileName || '',
        disclaimer: profile.disclaimer || '',
        items: profile.volumeDiscountProfileItemList && profile.volumeDiscountProfileItemList.length > 0
          ? profile.volumeDiscountProfileItemList
          : [{ minimumOrderQuantity: 10, discount: 5, preOrder: false, advancePayment: 100, deliveryFromDays: 7, deliveryToDays: 14 }],
      });
    }
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { minimumOrderQuantity: 50, discount: 10, preOrder: false, advancePayment: 100, deliveryFromDays: 7, deliveryToDays: 14 },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: keyof ProfileVolumeConfigItem, value: any) => {
    setFormData(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.profileName.trim()) {
      alert('Profile name is required');
      return;
    }

    setSaving(true);
    try {
      const payload: VolumeDiscountProfile = {
        profileName: formData.profileName.trim(),
        disclaimer: formData.disclaimer.trim(),
        volumeDiscountProfileItemList: formData.items,
      };

      if (editingProfile && editingProfile.id) {
        await ProfileService.updateVolumeDiscountProfile({ ...payload, id: editingProfile.id });
      } else {
        await ProfileService.addVolumeDiscountProfile(payload);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save volume discount profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await ProfileService.deleteVolumeDiscountProfile(deletingId);
      setDeletingId(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete volume discount profile.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = profiles.filter(p => !searchTerm || (p.profileName || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/manage-product/profile"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Volume Discount Profiles</h1>
            <p className="text-xs text-slate-500">Tiered quantity discount pricing rules (buy more, save more)</p>
          </div>
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
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Volume Discount Profile</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search volume discount profiles..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-400"
        />
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading volume discount profiles...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Profile Name</th>
                <th className="px-6 py-3.5">Disclaimer</th>
                <th className="px-6 py-3.5">Tiers Count</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    No volume discount profiles found.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{p.profileName}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 truncate max-w-xs">{p.disclaimer || '-'}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{(p.volumeDiscountProfileItemList || []).length} tier(s)</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => p.id && setDeletingId(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-6 shadow-xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingProfile ? 'Edit Volume Discount Profile' : 'Add Volume Discount Profile'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Profile Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.profileName}
                    onChange={e => setFormData({ ...formData, profileName: e.target.value })}
                    placeholder="e.g. Standard Wholesale Tiering"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Disclaimer Note
                  </label>
                  <input
                    type="text"
                    value={formData.disclaimer}
                    onChange={e => setFormData({ ...formData, disclaimer: e.target.value })}
                    placeholder="e.g. Discounts apply automatically at checkout"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Dynamic Discount Tiers */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Discount Tiers</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Tier</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Tier #{idx + 1}</span>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-400 hover:text-red-600"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                            Min MOQ
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 10"
                            value={item.minimumOrderQuantity || 0}
                            onChange={e => handleItemChange(idx, 'minimumOrderQuantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                            Discount (%)
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 10"
                            value={item.discount || 0}
                            onChange={e => handleItemChange(idx, 'discount', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                            Advance Payment (%)
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 50"
                            value={item.advancePayment || 100}
                            onChange={e => handleItemChange(idx, 'advancePayment', parseFloat(e.target.value) || 100)}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                            Delivery From (Days)
                          </label>
                          <input
                            type="number"
                            value={item.deliveryFromDays || 7}
                            onChange={e => handleItemChange(idx, 'deliveryFromDays', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                            Delivery To (Days)
                          </label>
                          <input
                            type="number"
                            value={item.deliveryToDays || 14}
                            onChange={e => handleItemChange(idx, 'deliveryToDays', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>
                        <div className="pt-3">
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!item.preOrder}
                              onChange={e => handleItemChange(idx, 'preOrder', e.target.checked)}
                              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                            />
                            <span>Is Pre-Order Tier</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Volume Discount Profile</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this volume discount profile? This action cannot be undone.
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
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm"
              >
                {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
