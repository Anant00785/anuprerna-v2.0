'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AccountDetails } from '@/components/profile/AccountDetails';
import { ProfileDataState } from '@/components/profile/ProfileDataState';
import { profileRepository } from '@/lib/api/repositories/profile.repository';
import { useAuthStore } from '@/stores/auth.store';
import { UserProfile } from '@/types/domain/profile';

// Was a server component rendering `mockUserProfile` — a hardcoded fake customer,
// identical for every visitor. Now reads the signed-in tenant from Loom.
export default function AccountPage() {
  const { jwt } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const customer = await profileRepository.getCustomerProfile(jwt || undefined);
      setProfile({
        tenant: {
          id: Number(customer.id) || 0,
          name: customer.name || [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim() || 'Customer',
          email: customer.email ?? '',
        },
      });
    } catch (err: any) {
      setError(err?.message || 'Could not load your account details.');
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ProfileDataState loading={loading} error={error} onRetry={load}>
      {profile && <AccountDetails profile={profile} />}
    </ProfileDataState>
  );
}
