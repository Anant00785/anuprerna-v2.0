'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Plus, Loader2, RefreshCw, Edit2, Trash2, X, PlusCircle, Trash } from 'lucide-react';
import { ProfileService, FabricProfile, FabricProfileConfigItem } from '@/services/profile-service';

export default function FabricProfilePage() {
  const [profiles, setProfiles] = useState<FabricProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<FabricProfile | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete states
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    profileName: string;
    items: FabricProfileConfigItem[];
  }>({
    profileName: '',
    items: [],
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ProfileService.getFabricProfiles();
      setProfiles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load fabric profiles.');
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
      items: [{ fabricId: 0, productName: '', sku: '', mockupText: '', mockupImage: '' }],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (profile: FabricProfile) => {
    setEditingProfile(profile);
    setIsModalOpen(true);
    try {
      if (profile.id) {
        const fullDetail = await ProfileService.getFabricProfileById(profile.id);
        setFormData({
          profileName: fullDetail.profileName || '',
          items: fullDetail.fabricProfileItemList && fullDetail.fabricProfileItemList.length > 0
            ? fullDetail.fabricProfileItemList
            : [{ fabricId: 0, productName: '', sku: '', mockupText: '', mockupImage: '' }],
        });
      }
    } catch {
      setFormData({
        profileName: profile.profileName || '',
        items: profile.fabricProfileItemList && profile.fabricProfileItemList.length > 0
          ? profile.fabricProfileItemList
          : [{ fabricId: 0, productName: '', sku: '', mockupText: '', mockupImage: '' }],
      });
    }
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { fabricId: 0, productName: '', sku: '', mockupText: '', mockupImage: '' }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: keyof FabricProfileConfigItem, value: any) => {
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
      const payload: FabricProfile = {
        profileName: formData.profileName.trim(),
        fabricProfileItemList: formData.items,
      };

      if (editingProfile && editingProfile.id) {
        await ProfileService.updateFabricProfile(editingProfile.id, { ...payload, id: editingProfile.id });
      } else {
        await ProfileService.addFabricProfile(payload);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save fabric profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await ProfileService.deleteFabricProfile(deletingId);
      setDeletingId(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete fabric profile.');
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
            <h1 className="text-xl font-bold text-slate-900">Fabric Profiles</h1>
            <p className="text-xs text-slate-500">Fabric profiles attached to products — weave, weight, composition</p>
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
            <span>Add Fabric Profile</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search fabric profiles..."
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
          <p className="text-sm text-slate-500 font-medium">Loading fabric profiles...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Profile Name</th>
                <th className="px-6 py-3.5">Fabrics Count</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                    No fabric profiles found.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{p.profileName}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{(p.fabricProfileItemList || []).length} item(s)</td>
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
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingProfile ? 'Edit Fabric Profile' : 'Add Fabric Profile'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Profile Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.profileName}
                  onChange={e => setFormData({ ...formData, profileName: e.target.value })}
                  placeholder="e.g. Cotton Handloom Fabric Profile"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Dynamic Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Fabric Config Items</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Fabric</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Fabric Item #{idx + 1}</span>
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
                        <input
                          type="number"
                          placeholder="Fabric ID"
                          value={item.fabricId || ''}
                          onChange={e => handleItemChange(idx, 'fabricId', parseInt(e.target.value) || 0)}
                          className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                        <input
                          type="text"
                          placeholder="Product Name"
                          value={item.productName || ''}
                          onChange={e => handleItemChange(idx, 'productName', e.target.value)}
                          className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                        <input
                          type="text"
                          placeholder="SKU"
                          value={item.sku || ''}
                          onChange={e => handleItemChange(idx, 'sku', e.target.value)}
                          className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Mockup Label / Text"
                          value={item.mockupText || ''}
                          onChange={e => handleItemChange(idx, 'mockupText', e.target.value)}
                          className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                        <input
                          type="text"
                          placeholder="Mockup Image URL"
                          value={item.mockupImage || ''}
                          onChange={e => handleItemChange(idx, 'mockupImage', e.target.value)}
                          className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
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
            <h3 className="text-base font-bold text-slate-900">Delete Fabric Profile</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this fabric profile? This action cannot be undone.
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
