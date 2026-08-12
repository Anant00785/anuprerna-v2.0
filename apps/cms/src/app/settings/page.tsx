'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import { SettingsService, SettingsItem } from '@/services/settings-service';
import { ExternalLink, Edit2, Check, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await SettingsService.getSettings();
      setSettings(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggleBoolean = async (item: SettingsItem) => {
    const newValue = !item.attributeValue;
    setSettings((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, attributeValue: newValue } : s))
    );
    await SettingsService.updateSettingsItem(item.id, newValue);
  };

  const handleStartEdit = (item: SettingsItem) => {
    setEditingId(item.id);
    setEditValue(
      typeof item.attributeValue === 'object'
        ? JSON.stringify(item.attributeValue)
        : String(item.attributeValue)
    );
  };

  const handleSaveEdit = async (item: SettingsItem) => {
    let parsed: any = editValue;
    if (item.attributeType === 'NUMBER') parsed = Number(editValue);
    if (item.attributeType === 'OBJECT') {
      try {
        parsed = JSON.parse(editValue);
      } catch {
        alert('Invalid JSON object');
        return;
      }
    }

    setSettings((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, attributeValue: parsed } : s))
    );
    setEditingId(null);
    await SettingsService.updateSettingsItem(item.id, parsed);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeading heading="Configuration Settings" />

      {/* Main Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Configuration Settings</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your application configuration parameters and their values.
            </p>
          </div>
          <button
            onClick={fetchSettings}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Link</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {settings.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Name */}
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">
                    {item.attributeName}
                  </td>

                  {/* Type */}
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.attributeType === 'BOOLEAN'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : item.attributeType === 'NUMBER'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : item.attributeType === 'OBJECT'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}
                    >
                      {item.attributeType}
                    </span>
                  </td>

                  {/* Value */}
                  <td className="px-6 py-4 max-w-sm">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-indigo-400 rounded focus:outline-none focus:ring-1 focus:ring-indigo-600 font-mono"
                        />
                        <button
                          onClick={() => handleSaveEdit(item)}
                          className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : item.attributeType === 'BOOLEAN' ? (
                      <button
                        onClick={() => handleToggleBoolean(item)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                          item.attributeValue ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white shadow-2xs transition-transform ${
                            item.attributeValue ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    ) : (
                      <span className="font-mono text-slate-700 truncate block max-w-xs">
                        {typeof item.attributeValue === 'object'
                          ? JSON.stringify(item.attributeValue)
                          : String(item.attributeValue)}
                      </span>
                    )}
                  </td>

                  {/* Link */}
                  <td className="px-6 py-4 text-slate-500">
                    {item.attributeLink ? (
                      <Link
                        href={item.attributeLink}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold transition"
                      >
                        <span className="truncate max-w-[180px]">{item.attributeLink}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      title="Edit configuration value"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
