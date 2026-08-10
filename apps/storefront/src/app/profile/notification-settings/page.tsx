import React from 'react';
import { NotificationSettingsView } from '@/components/profile/NotificationSettingsView';
import { mockNotificationPreferences, mockNotificationLogs } from '@/lib/profile/dummy-data';

export default function NotificationSettingsPage() {
  return (
    <NotificationSettingsView
      initialPreferences={mockNotificationPreferences}
      initialLogs={mockNotificationLogs}
    />
  );
}
