'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AddressBook } from '@/components/profile/AddressBook';
import { ProfileDataState } from '@/components/profile/ProfileDataState';
import { profileRepository } from '@/lib/api/repositories/profile.repository';
import { useAuthStore } from '@/stores/auth.store';
import { AddressItem } from '@/types/domain/profile';

// Was a server component rendering `mockAddresses` — two invented addresses shown
// to every customer. Loom's address payload already matches `AddressItem` field
// for field (see fabric's `address/interface/address.ts`), so no mapping is needed.
export default function AddressPage() {
  const { jwt } = useAuthStore();
  const [addresses, setAddresses] = useState<AddressItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await profileRepository.getAddressList(jwt || undefined);
      setAddresses(list as unknown as AddressItem[]);
    } catch (err: any) {
      setError(err?.message || 'Could not load your addresses.');
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ProfileDataState loading={loading} error={error} onRetry={load}>
      {addresses && <AddressBook initialAddresses={addresses} />}
    </ProfileDataState>
  );
}
