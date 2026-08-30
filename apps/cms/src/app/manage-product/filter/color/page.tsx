'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Loader2, X, Search } from 'lucide-react';
import { ProductService, ColorFilter } from '@/services/product-service';

export default function ColorFilterPage() {
  const [colors, setColors] = useState<ColorFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [hex, setHex] = useState('#000000');
  const [saving, setSaving] = useState(false);

  const fetchColors = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ProductService.getColors();
      setColors(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load colors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColors();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setHex('#000000');
    setModalOpen(true);
  };

  const openEditModal = (c: ColorFilter) => {
    setEditingId(c.id);
    setName(c.name || '');
    setHex(c.hex || '#000000');
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this color?')) return;
    try {
      await ProductService.deleteColor(id);
      fetchColors();
    } catch (err: any) {
      alert(err.message || 'Failed to delete color.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      if (editingId) {
        await ProductService.updateColor(editingId, name, hex);
      } else {
        await ProductService.createColor(name, hex);
      }
      setModalOpen(false);
      fetchColors();
    } catch (err: any) {
      alert(err.message || 'Failed to save color.');
    } finally {
      setSaving(false);
    }
  };

  const filteredColors = colors.filter(c =>
    !searchTerm.trim() || (c.name || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="space-y-6 pt-2 pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🎨</div>
          <div>
            <h1 className="text-xl font-bold text-[#1f2438] tracking-tight">Color Palette Filters</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage color swatches and hex codes for storefront filtering
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-64">
            <input
              type="text"
              placeholder="Search colors..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#585c82]"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#585c82] hover:bg-[#484c70] rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Color</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* COLOR GRID */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-100">
          <Loader2 className="w-7 h-7 text-[#585c82] animate-spin" />
          <p className="text-xs text-slate-500 font-light tracking-wide uppercase">
            Loading colors...
          </p>
        </div>
      ) : filteredColors.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-100">
          No colors found.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {filteredColors.map(c => (
            <div
              key={c.id}
              className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col items-center gap-3 group relative hover:shadow-md transition-all"
            >
              <div
                className="w-12 h-12 rounded-full border border-slate-300 shadow-inner flex items-center justify-center"
                style={{ backgroundColor: c.hex || '#ffffff' }}
              />
              <div className="text-center">
                <span className="font-bold text-slate-900 text-xs block truncate max-w-[120px]">{c.name}</span>
                <span className="font-mono text-[10px] text-slate-400 uppercase">{c.hex || '#N/A'}</span>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditModal(c)}
                  className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                  title="Edit Color"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  title="Delete Color"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1f2438]">
                {editingId ? 'Edit Color' : 'Add Color'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Color Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indigo Blue"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#585c82]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hex Code
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={hex}
                    onChange={e => setHex(e.target.value)}
                    className="w-10 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    required
                    value={hex}
                    onChange={e => setHex(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-[#585c82]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#585c82] hover:bg-[#484c70] rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingId ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
