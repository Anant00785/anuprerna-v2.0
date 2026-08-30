'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

  const renderValue = (item: SettingsItem) => {
    if (item.attributeType === 'OBJECT') {
      const ver = (item.attributeValue as any)?.assumptionVersion || 1;
      return <span className="text-slate-800 text-xs font-normal">Version v{ver}</span>;
    }
    if (item.attributeType === 'BOOLEAN') {
      return (
        <button
          type="button"
          onClick={() => handleToggleBoolean(item)}
          className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
            item.attributeValue ? 'bg-indigo-600' : 'bg-slate-200'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white shadow-2xs transition-transform ${
              item.attributeValue ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      );
    }
    if (item.attributeType === 'NUMBER') {
      return <span className="text-slate-800 text-xs font-normal">{item.attributeValue}</span>;
    }
    return (
      <span className="text-slate-800 text-xs font-normal line-clamp-2">
        {String(item.attributeValue)}
      </span>
    );
  };

  const renderBadge = (type: string) => {
    switch (type) {
      case 'OBJECT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#e0f2fe] text-[#0369a1]">
            OBJECT
          </span>
        );
      case 'BOOLEAN':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#dcfce7] text-[#166534]">
            BOOLEAN
          </span>
        );
      case 'NUMBER':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f3e8ff] text-[#7e22ce]">
            NUMBER
          </span>
        );
      case 'TEXT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#ffe4e6] text-[#be123c]">
            TEXT
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pt-1 pb-20 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400">🏠</span>
        <span className="text-slate-400">/</span>
        <span className="bg-[#1f2438] text-white px-2.5 py-0.5 rounded text-[11px] font-medium">
          Settings
        </span>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Configuration Settings</h2>
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
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                <th className="px-6 py-3.5 font-semibold">Name</th>
                <th className="px-6 py-3.5 font-semibold">Type</th>
                <th className="px-6 py-3.5 font-semibold">Value</th>
                <th className="px-6 py-3.5 font-semibold">Link</th>
                <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {settings.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition">
                  {/* Name */}
                  <td className="px-6 py-4 font-mono font-bold text-slate-800 text-xs whitespace-nowrap">
                    {item.attributeName}
                  </td>

                  {/* Type */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderBadge(item.attributeType)}
                  </td>

                  {/* Value */}
                  <td className="px-6 py-4 max-w-md">
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
                    ) : (
                      renderValue(item)
                    )}
                  </td>

                  {/* Link */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.attributeLink ? (
                      <a
                        href={item.attributeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2563eb] hover:underline flex items-center gap-1 text-xs truncate max-w-xs"
                      >
                        <span className="truncate">
                          {item.attributeLink.length > 30
                            ? `${item.attributeLink.slice(0, 30)}...`
                            : item.attributeLink}
                        </span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 text-slate-400 text-xs font-normal">
          Showing {settings.length} of {settings.length} configurations
        </div>
      </div>
    </div>
  );
}
