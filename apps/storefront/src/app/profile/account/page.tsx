import React from 'react';
import { AccountDetails } from '@/components/profile/AccountDetails';
import { mockUserProfile } from '@/lib/profile/dummy-data';

export default function AccountPage() {
  return <AccountDetails profile={mockUserProfile} />;
}
