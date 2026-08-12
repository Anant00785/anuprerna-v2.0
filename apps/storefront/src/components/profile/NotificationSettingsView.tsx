'use client';

import React, { useState } from 'react';
import { NotificationPreference, NotificationActivityLog } from '@/types/domain/profile';

interface NotificationSettingsViewProps {
  initialPhone?: string;
  initialPreferences: NotificationPreference[];
  initialLogs: NotificationActivityLog[];
}

export const NotificationSettingsView: React.FC<NotificationSettingsViewProps> = ({
  initialPhone = '+91 9876543210',
  initialPreferences,
  initialLogs,
}) => {
  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [phone, setPhone] = useState(initialPhone);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [validity, setValidity] = useState('1_year');
  const [preferences, setPreferences] = useState<NotificationPreference[]>(initialPreferences);
  const [logs, setLogs] = useState<NotificationActivityLog[]>(initialLogs);
  const [consentActive, setConsentActive] = useState(true);

  const handleTogglePref = (id: string) => {
    setPreferences((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextVal = !p.enabled;
          // Add to log
          const newLog: NotificationActivityLog = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleString(),
            action: 'Preference Updated',
            details: `${p.title} set to ${nextVal ? 'Enabled' : 'Disabled'}`,
          };
          setLogs([newLog, ...logs]);
          return { ...p, enabled: nextVal };
        }
        return p;
      })
    );
  };

  const handleSavePhone = () => {
    setPhone(phoneInput);
    setIsEditingPhone(false);
    const newLog: NotificationActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      action: 'Number Updated',
      details: `WhatsApp number updated to ${phoneInput}`,
    };
    setLogs([newLog, ...logs]);
  };

  const handleStopAll = () => {
    setConsentActive(false);
    setPreferences((prev) => prev.map((p) => ({ ...p, enabled: false })));
    const newLog: NotificationActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      action: 'Opted Out',
      details: 'User stopped all WhatsApp notification channels',
    };
    setLogs([newLog, ...logs]);
  };

  const handleOptIn = () => {
    setConsentActive(true);
    setPreferences((prev) => prev.map((p) => ({ ...p, enabled: true })));
    const newLog: NotificationActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      action: 'Consent Confirmed',
      details: `WhatsApp notifications activated for ${phone}`,
    };
    setLogs([newLog, ...logs]);
  };

  return (
    <div className="w-full space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage how and where you receive updates from us.</p>
      </header>

      {/* Channel Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveChannel('whatsapp')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeChannel === 'whatsapp'
              ? 'border-[#8E7862] text-[#8E7862]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">chat</span>
          WhatsApp Channel
        </button>

        <button
          onClick={() => setActiveChannel('email')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeChannel === 'email'
              ? 'border-[#8E7862] text-[#8E7862]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">mail</span>
          Email Channel
        </button>
      </div>

      {activeChannel === 'whatsapp' ? (
        <div className="space-y-6">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
              consentActive ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-2xl ${consentActive ? 'text-emerald-600' : 'text-amber-600'}`}>
                {consentActive ? 'check_circle' : 'warning'}
              </span>
              <div>
                <p className="font-bold text-gray-900 text-sm">
                  {consentActive ? 'WhatsApp Notifications Active' : 'WhatsApp Notifications Opted Out'}
                </p>
                <p className="text-xs text-gray-600">
                  {consentActive ? `Connected to ${phone}` : 'You are currently not receiving WhatsApp alerts.'}
                </p>
              </div>
            </div>

            {!consentActive && (
              <button
                onClick={handleOptIn}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
              >
                Opt-in Now
              </button>
            )}
          </div>

          {/* Number & Validity Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900">WhatsApp Phone Number & Consent</h3>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl">
              <div>
                <span className="text-xs text-gray-500 font-medium">Primary WhatsApp Number</span>
                {isEditingPhone ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#B7A990]"
                    />
                    <button
                      onClick={handleSavePhone}
                      className="px-3 py-1.5 bg-[#8E7862] text-white text-xs font-semibold rounded-lg hover:bg-[#6c5b48]"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <p className="text-base font-bold text-gray-900 mt-0.5">{phone}</p>
                )}
              </div>

              {!isEditingPhone && (
                <button
                  onClick={() => setIsEditingPhone(true)}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-semibold"
                >
                  Edit Number
                </button>
              )}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Consent Validity Duration</label>
              <select
                value={validity}
                onChange={(e) => setValidity(e.target.value)}
                className="w-full max-w-xs px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#B7A990]"
              >
                <option value="30_days">30 Days</option>
                <option value="90_days">90 Days</option>
                <option value="180_days">180 Days</option>
                <option value="1_year">1 Year (Recommended)</option>
              </select>
            </div>
          </div>

          {/* Preferences Toggles List */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900">Notification Preferences</h3>

            <div className="space-y-3">
              {preferences.map((pref) => (
                <div key={pref.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <div className="space-y-0.5 pr-4">
                    <p className="font-bold text-gray-900 text-sm">{pref.title}</p>
                    <p className="text-xs text-gray-500">{pref.description}</p>
                  </div>

                  <button
                    onClick={() => handleTogglePref(pref.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      pref.enabled && consentActive ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        pref.enabled && consentActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900">Consent & Message Activity Log</h3>
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="p-3 bg-gray-50 rounded-lg text-xs flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-gray-900">{log.action}: </span>
                    <span className="text-gray-600">{log.details}</span>
                  </div>
                  <span className="text-gray-400 font-mono text-[11px]">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          {consentActive && (
            <div className="p-6 bg-red-50/60 border border-red-200 rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-red-900">Danger Zone</h4>
              <p className="text-xs text-red-700">Stop all WhatsApp message streams instantly.</p>
              <button
                onClick={handleStopAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Stop All Messages
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center py-12 text-gray-500 text-sm">
          Email notification preferences are synchronized with your account email address ({phone}).
        </div>
      )}
    </div>
  );
};
