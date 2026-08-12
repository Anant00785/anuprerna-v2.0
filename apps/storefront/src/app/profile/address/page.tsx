import React from 'react';
import { AddressBook } from '@/components/profile/AddressBook';
import { mockAddresses } from '@/lib/profile/dummy-data';

export default function AddressPage() {
  return <AddressBook initialAddresses={mockAddresses} />;
}
