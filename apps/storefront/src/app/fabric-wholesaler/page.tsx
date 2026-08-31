import WholesalerListingPage from '@/components/seo-landing/WholesalerListingPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Global Fabric Wholesaler | Handloom Fabric Supplier — Anuprerna',
  description:
    'Anuprerna is a global handloom fabric wholesaler supplying premium artisan textiles to fashion brands and designers worldwide. Find a fabric supplier near you.',
};

export default function Page() {
  return <WholesalerListingPage />;
}
