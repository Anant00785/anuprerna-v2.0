'use client';

import React, { useEffect, useState } from 'react';
import { WholesaleProgramView } from '@/components/profile/WholesaleProgramView';
import {
  mockWholesaleMembershipInfo,
  mockWholesaleOrderInfo,
  mockOrderList,
} from '@/lib/profile/dummy-data';
import { profileRepository } from '@/lib/api/repositories/profile.repository';
import { useAuthStore } from '@/stores/auth.store';

export default function WholesaleProgramPage() {
  const { jwt, user } = useAuthStore();
  const [membershipInfo, setMembershipInfo] = useState(mockWholesaleMembershipInfo);
  const [orderInfo, setOrderInfo] = useState(mockWholesaleOrderInfo);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadWholesaleData() {
      setLoading(true);
      try {
        const liveInfo = await profileRepository.getWholesaleInfo(jwt || undefined);
        if (liveInfo) {
          setMembershipInfo((prev) => ({
            ...prev,
            percentileDiscount: liveInfo.discountPercentage ?? prev.percentileDiscount,
          }));
        }
      } catch (err) {
        // Fall back to default static mock
      } finally {
        setLoading(false);
      }
    }

    loadWholesaleData();
  }, [jwt]);

  const tenantName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Valued Customer';

  return (
    <WholesaleProgramView
      membershipInfo={membershipInfo}
      orderInfo={orderInfo}
      orders={mockOrderList}
      tenantName={tenantName}
    />
  );
}
