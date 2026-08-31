'use client';
import { useMemo, useState } from 'react';

export interface NotificationPref {
  id: string;
  title: string;
  description: string;
  type: string; // 'core' | 'marketing'
  enabled: boolean;
}

interface Props {
  initialNumber: string;
  optedIn: boolean;
  preferences: NotificationPref[];
  consentExpiresAt: number | null;
}

const MS_MONTH = 30.44 * 24 * 60 * 60 * 1000;

function inferValidity(expiresAt: number | null): number {
  if (expiresAt === -1) return -1;
  if (!expiresAt) return -1;
  const months = (expiresAt - Date.now()) / MS_MONTH;
  if (months > 18) return 24;
  if (months > 9) return 12;
  return 6;
}

function computeRemaining(expiresAt: number | null, validityMonths: number): number {
  if (expiresAt === -1) return 100;
  if (!expiresAt || expiresAt <= Date.now()) return 0;
  const windowMs = validityMonths * MS_MONTH;
  return Math.round(Math.min(100, ((expiresAt - Date.now()) / windowMs) * 100));
}

// Demo-mode notification settings. WhatsApp-only, matching the live
// profile-notifications-settings IA. All mutations are local-only (no writes
// to the real account) — the live opt-in/out API is intentionally not called.
export default function NotificationSettingsClient({ initialNumber, optedIn, preferences, consentExpiresAt }: Props) {
  const [editing, setEditing] = useState(false);
  const [number, setNumber] = useState(initialNumber);
  const [draftNumber, setDraftNumber] = useState(initialNumber);
  const [prefs, setPrefs] = useState<NotificationPref[]>(preferences);
  const [validity, setValidity] = useState<number>(inferValidity(consentExpiresAt));

  const remaining = useMemo(() => computeRemaining(consentExpiresAt, validity), [consentExpiresAt, validity]);

  const statusLabel = optedIn ? 'Active' : 'Inactive';
  const statusClass = optedIn ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500';

  return (
    <section className="flex flex-col gap-6 p-1 md:p-2">
      <header>
        <h1 className="text-xl font-semibold text-gray-900 md:text-2xl">Notification Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage how and where you receive updates from us.</p>
      </header>

      {/* Channel tabs — single WhatsApp tab, green underline active */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-green-700 border-b-2 border-green-600 -mb-px"
        >
          <span className="material-symbols-outlined text-[18px]">chat</span>
          <span>WhatsApp</span>
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <header>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">WhatsApp Notifications</h2>
            <span className={'rounded-full px-2 py-0.5 text-xs font-medium ' + statusClass}>{statusLabel}</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">Manage your WhatsApp consent and choose what updates you receive.</p>
        </header>

        {/* Number card */}
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Whatsapp number</div>
          {!editing ? (
            <div className="mt-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center text-green-600 material-symbols-outlined text-[18px]">chat</span>
                <span className="text-base font-medium tracking-[0.2px] text-gray-900">{number || 'No number on file'}</span>
              </div>
              <button
                type="button"
                onClick={() => { setDraftNumber(number); setEditing(true); }}
                className="min-w-[72px] rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white"
              >
                Edit
              </button>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              <input
                type="tel"
                value={draftNumber}
                onChange={(e) => setDraftNumber(e.target.value)}
                placeholder="+91 99999 99999"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => { setNumber(draftNumber.trim()); setEditing(false); }}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* What to receive */}
        <div>
          <h3 className="mb-3 text-base font-semibold text-gray-900">What to receive</h3>
          <div className="rounded-xl border border-gray-200 bg-white">
            {prefs.map((pref, i) => {
              const isCore = pref.type === 'core';
              const badgeClass = isCore ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500';
              return (
                <div
                  key={pref.id}
                  className={'flex items-start justify-between gap-4 p-4 ' + (i < prefs.length - 1 ? 'border-b border-gray-100' : '')}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{pref.title}</span>
                      <span className={'rounded-full px-2 py-0.5 text-[11px] font-medium ' + badgeClass}>
                        {isCore ? 'Core service' : 'Marketing'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{pref.description}</p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={pref.enabled}
                    onClick={() =>
                      setPrefs((cur) => cur.map((p) => (p.id === pref.id ? { ...p, enabled: !p.enabled } : p)))
                    }
                    className={
                      'relative w-10 h-[22px] rounded-full transition-colors flex-shrink-0 ' +
                      (pref.enabled ? 'bg-green-500' : 'bg-gray-300')
                    }
                  >
                    <span
                      className={
                        'absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ' +
                        (pref.enabled ? 'translate-x-[18px]' : '')
                      }
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Consent validity */}
        <div>
          <h3 className="mb-3 text-base font-semibold text-gray-900">Consent validity</h3>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <label className="text-sm font-medium text-gray-700">How long should your consent remain valid?</label>
            <div className="mt-3 flex items-center justify-between gap-4">
              <select
                value={validity}
                onChange={(e) => setValidity(Number(e.target.value))}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
              >
                {[-1, 24, 12, 6].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt > 0 ? opt + ' months' : 'Always'}
                  </option>
                ))}
              </select>
              {validity > 0 && <span className="text-sm text-gray-500">{validity} months total</span>}
            </div>
            {validity > 0 && (
              <>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-green-500 transition-[width] duration-300" style={{ width: remaining + '%' }} />
                </div>
                <p className="mt-2 text-xs text-gray-500">{remaining}% remaining</p>
              </>
            )}
          </div>
        </div>

        {/* Stop Messages danger zone */}
        <div>
          <h3 className="mb-3 text-base font-semibold text-gray-900">Stop Messages</h3>
          <div className="rounded-xl border border-red-100 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Stop all WhatsApp messages</p>
                <p className="mt-1 text-sm text-gray-500">This will disable all notifications and revoke your consent.</p>
              </div>
              <button
                type="button"
                disabled
                title="Disabled in demo mode"
                className="rounded-md border border-red-500 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 cursor-not-allowed opacity-70"
              >
                Stop all messages
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
