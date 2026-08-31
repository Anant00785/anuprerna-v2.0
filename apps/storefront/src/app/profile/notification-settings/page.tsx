import { cookies } from 'next/headers';
import { loomGet } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import NotificationSettingsClient, { NotificationPref } from '@/components/profile/NotificationSettingsClient';

export const metadata = {
  title: 'Notification Settings | Anuprerna',
  robots: { index: false, follow: false },
};

const FALLBACK_PREFS: NotificationPref[] = [
  {
    id: 'order-confirmations',
    title: 'Order confirmations',
    description: 'Get notified when your order is placed, shipped, and delivered.',
    type: 'core',
    enabled: true,
  },
  {
    id: 'production-updates',
    title: 'Production & artisan updates',
    description: 'Follow your item from loom to doorstep with behind-the-scenes updates.',
    type: 'core',
    enabled: true,
  },
  {
    id: 'collections-offers',
    title: 'New collections & offers',
    description: 'Be the first to know about new drops, seasonal sales, and artisan stories.',
    type: 'marketing',
    enabled: true,
  },
];

export default async function NotificationSettingsPage() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return null;

  let whatsappNumber = '';
  let optInStatus = '';
  let preferences: NotificationPref[] = [];
  let consentExpiresAt: number | null = null;

  try {
    const res = await loomGet<{
      customer?: {
        whatsappNumber?: string;
        whatsappOptInStatus?: string;
        whatsappPreferences?: NotificationPref[];
        whatsappConsentExpiresAt?: number;
      };
    }>('/get/customer/profile', { token });
    whatsappNumber = res?.customer?.whatsappNumber ?? '';
    optInStatus = res?.customer?.whatsappOptInStatus ?? '';
    preferences = res?.customer?.whatsappPreferences ?? [];
    consentExpiresAt = res?.customer?.whatsappConsentExpiresAt ?? null;
  } catch {
    // fall through to fallback prefs
  }

  return (
    <>
      <meta name="robots" content="noindex" />
      <NotificationSettingsClient
        initialNumber={whatsappNumber}
        optedIn={optInStatus === 'OPTED_IN'}
        preferences={preferences.length ? preferences : FALLBACK_PREFS}
        consentExpiresAt={consentExpiresAt}
      />
    </>
  );
}
