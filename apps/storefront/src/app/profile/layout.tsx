import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loomGet } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import ProfileShell from '@/components/profile/ProfileShell';

// All profile pages are login-gated. Middleware checks cookie presence;
// this layout does a soft re-validate and extracts the user name for the shell.
export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) redirect('/auth?redirect=/profile/dashboard');

  let userName: string | undefined;
  let showWholesale = false;
  try {
    const profileRes = await loomGet<{
      customer?: {
        tenant?: { name?: string; email?: string };
        everEnrolledForLoyaltyProgram?: boolean;
      };
    }>('/get/customer/profile', { token });
    userName = profileRes?.customer?.tenant?.name;
    showWholesale = profileRes?.customer?.everEnrolledForLoyaltyProgram === true;
  } catch {
    // non-fatal -- shell works without name
  }

  return (
    <ProfileShell userName={userName} showWholesale={showWholesale}>
      {children}
    </ProfileShell>
  );
}
