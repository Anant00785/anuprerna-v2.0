import { cookies } from 'next/headers';
import { loomGet } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
// "Who do you buy for?", changeable at any time with no prompt and no
// threshold — the thing that makes the one-tap offer elsewhere safe to accept.
import BuyerTypeSetting from '@/components/profile/BuyerTypeSetting';

export const metadata = {
  title: 'Account | Anuprerna',
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return null;

  let customer: Record<string, unknown> | null = null;
  let customerId: number | null = null;
  try {
    const res = await loomGet<{ customer?: { tenant?: Record<string, unknown>; id?: number } }>('/get/customer/profile', { token });
    customer = res?.customer?.tenant ?? null;
    customerId = (res?.customer as Record<string, unknown> | undefined)?.id as number | null ?? null;
  } catch {
    // empty
  }

  const name  = (customer?.name as string | undefined) ?? '';
  const email = (customer?.email as string | undefined) ?? '';

  return (
    <>
      <meta name="robots" content="noindex" />

      {/* Page title — matches live's "ACCOUNT" heading */}
      <h1 className="text-2xl font-semibold text-center uppercase tracking-wide text-gray-900 mb-2">
        Account
      </h1>

      {/* Account Info section label */}
      <p className="text-sm text-gray-500 mb-6">
        Account Info{customerId ? <> - <span className="text-gray-400">#{customerId}</span></> : null}
      </p>

      {/* Single Account Info card — matches live's minimal layout */}
      <div className="bg-sand/30 rounded p-8 flex items-center gap-8">
        {/* Avatar — live shows a large black circle (profile photo) */}
        <div className="w-32 h-32 rounded-full bg-gray-900 flex-shrink-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[56px]">person</span>
        </div>

        <div>
          {/* Name with edit icon stub */}
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-semibold text-gray-900">{name || '—'}</h2>
            <button
              disabled
              title="Profile editing disabled in demo mode"
              className="text-gray-400 cursor-not-allowed opacity-50"
              aria-label="Edit name"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
          </div>

          <p className="text-gray-600 text-sm mb-3">{email}</p>

          {/* Change Password stub */}
          <button
            disabled
            title="Password change disabled in demo mode"
            className="text-sm text-gray-500 underline cursor-not-allowed opacity-60"
          >
            Change Password
          </button>
        </div>
      </div>

      <BuyerTypeSetting />
    </>
  );
}
