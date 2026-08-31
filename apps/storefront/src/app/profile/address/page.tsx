import { cookies } from 'next/headers';
import { loomGet } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import AddressBookClient, { Address } from '@/components/profile/AddressBookClient';

export const metadata = {
  title: 'My Addresses | Anuprerna',
  robots: { index: false, follow: false },
};

export default async function AddressPage() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return null;

  let addresses: Address[] = [];
  try {
    const res = await loomGet<{ addressList?: Address[] }>('/get/address-list', { token });
    addresses = res?.addressList ?? [];
  } catch {
    // empty state
  }

  return (
    <>
      <meta name="robots" content="noindex" />

      <h1 className="text-2xl font-semibold text-center uppercase tracking-wide text-gray-900 mb-8">
        Address
      </h1>

      <AddressBookClient addresses={addresses} />
    </>
  );
}
