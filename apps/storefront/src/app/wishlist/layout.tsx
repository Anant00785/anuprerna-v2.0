import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

export const metadata = {
  title: 'My Wishlist | Anuprerna',
  robots: { index: false, follow: false },
};

export default async function WishlistLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) redirect('/auth?redirect=/wishlist');
  return <>{children}</>;
}
