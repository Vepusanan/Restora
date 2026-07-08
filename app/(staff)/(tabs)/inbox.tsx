import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { NotificationItem } from '@/src/components/notifications/NotificationItem';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { MOCK_NOTIFICATIONS } from '@/src/data/mock';
import type { AppNotification } from '@/src/types/restora';

export default function StaffInboxScreen() {
  const [notifications, setNotifications] = useState<AppNotification[]>(
    MOCK_NOTIFICATIONS.filter((n) => n.type !== 'staff'),
  );

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="Notifications"
        subtitle="Expiry alerts and updates"
        rightAction={
          <Pressable
            onPress={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}>
            <Text className="text-sm font-medium text-mint-deep">Mark all read</Text>
          </Pressable>
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          message="Expiry alerts and operational updates will appear here."
        />
      ) : (
        notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onPress={() => markRead(notification.id)}
          />
        ))
      )}
    </Screen>
  );
}
