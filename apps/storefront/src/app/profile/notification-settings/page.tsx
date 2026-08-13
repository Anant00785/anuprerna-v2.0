'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { NotificationSettingsView } from '@/components/profile/NotificationSettingsView';
import { ProfileDataState } from '@/components/profile/ProfileDataState';
import { profileRepository } from '@/lib/api/repositories/profile.repository';
import { NOTIFICATION_PREFERENCE_DEFAULTS } from '@/lib/profile/notification-defaults';
import { useAuthStore } from '@/stores/auth.store';
import { NotificationPreference } from '@/types/domain/profile';

/**
 * WhatsApp notification settings.
 *
 * Preferences are not a separate endpoint — they live on the customer record as
 * `whatsappPreferences`, alongside `whatsappNumber` and `whatsappOptInStatus`
 * (Loom's `Customer` entity; the legacy storefront reads exactly these in
 * `profile-notifications-settings.component.ts:69-77`). When the customer has never
 * opted in, the field is absent and the legacy app falls back to a fixed default
 * list, which is what `NOTIFICATION_PREFERENCE_DEFAULTS` mirrors.
 *
 * The activity log has no backing endpoint at all: the legacy app hardcodes
 * `this.activityLog = []` (same file, line 97). The previous mock log here — with
 * invented timestamps, a fake AWB number and a fake order id — described events that
 * never happened, so it is gone rather than replaced.
 */
export default function NotificationSettingsPage() {
  const { jwt } = useAuthStore();
  const [preferences, setPreferences] = useState<NotificationPreference[] | null>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const customer = await profileRepository.getCustomerProfile(jwt || undefined);
      const stored = (customer as Record<string, any>).whatsappPreferences;
      setPreferences(
        Array.isArray(stored) && stored.length > 0
          ? stored.map((p: Record<string, any>) => ({
              id: String(p.id ?? ''),
              title: String(p.title ?? ''),
              description: String(p.description ?? ''),
              enabled: Boolean(p.enabled),
            }))
          : NOTIFICATION_PREFERENCE_DEFAULTS.map((p) => ({ ...p }))
      );
      setPhone(String((customer as Record<string, any>).whatsappNumber ?? customer.phone ?? ''));
    } catch (err: any) {
      setError(err?.message || 'Could not load your notification settings.');
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ProfileDataState loading={loading} error={error} onRetry={load}>
      {preferences && (
        <NotificationSettingsView
          initialPhone={phone}
          initialPreferences={preferences}
          initialLogs={[]}
        />
      )}
    </ProfileDataState>
  );
}
