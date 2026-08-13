import type { NotificationPreference } from '@/types/domain/profile';

/**
 * The preference rows shown when a customer has never opted in, so Loom has no
 * `whatsappPreferences` on their record yet.
 *
 * These are UI defaults, not data about the customer — the distinction matters.
 * Copied from the legacy storefront's `NOTIFICATION_PREFERENCES_SEED`
 * (fabric-master/.../profile-notifications-settings/model/notification-settings-seed.ts)
 * so both apps offer the same choices with the same ids; the ids are what get
 * persisted back to Loom on opt-in.
 */
export const NOTIFICATION_PREFERENCE_DEFAULTS: readonly NotificationPreference[] = [
  {
    id: 'order-confirmations',
    title: 'Order confirmations',
    description: 'Get notified when your order is placed, shipped, and delivered.',
    enabled: true,
  },
  {
    id: 'production-updates',
    title: 'Production & artisan updates',
    description: 'Follow your item from loom to doorstep with behind-the-scenes updates.',
    enabled: true,
  },
  {
    id: 'collections-offers',
    title: 'New collections & offers',
    description: 'Be the first to know about new drops, seasonal sales, and artisan stories.',
    enabled: true,
  },
];
