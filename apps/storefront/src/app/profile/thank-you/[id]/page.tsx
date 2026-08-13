'use client';

import React, { use, useCallback, useEffect, useState } from 'react';
import { OrderThankYouView } from '@/components/profile/OrderThankYouView';
import { ProfileDataState, ProfileEmptyState } from '@/components/profile/ProfileDataState';
import { profileRepository } from '@/lib/api/repositories/profile.repository';
import { toOrderDetails } from '@/lib/profile/adapters';
import { useAuthStore } from '@/stores/auth.store';
import { OrderDetails } from '@/types/domain/profile';

// Post-checkout confirmation. Was rendering `mockSingleOrderDetails`, so it
// confirmed an invented order — including invented totals — to anyone who landed
// here. Now reads the real order it is confirming.
export default function OrderThankYouPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { jwt } = useAuthStore();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await profileRepository.getOrder(id, jwt || undefined);
      setOrder(raw ? toOrderDetails(raw) : null);
    } catch (err: any) {
      setError(err?.message || 'Could not load your order confirmation.');
    } finally {
      setLoading(false);
    }
  }, [id, jwt]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ProfileDataState loading={loading} error={error} onRetry={load}>
      {order ? (
        <OrderThankYouView order={order} />
      ) : (
        <ProfileEmptyState message={`We couldn't find order ${id} on your account.`} />
      )}
    </ProfileDataState>
  );
}
