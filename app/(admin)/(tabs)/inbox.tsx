import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { NotificationItem } from '@/src/components/notifications/NotificationItem';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { MOCK_NOTIFICATIONS } from '@/src/data/mock';
import type { AppNotification } from '@/src/types/restora';

export default function AdminInboxScreen() {
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const visible =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <Screen>
      <ScreenHeader
        title="Notifications"
        subtitle={`${notifications.filter((n) => !n.read).length} unread`}
        rightAction={
          <Pressable onPress={markAllRead}>
            <Text className="text-sm font-medium text-mint-deep">Mark all read</Text>
          </Pressable>
        }
      />

      <View className="mb-4 flex-row gap-2">
        {(['all', 'unread'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setFilter(tab)}
            className={`rounded-full px-4 py-2 ${filter === tab ? 'bg-primary' : 'border border-hairline bg-canvas'}`}>
            <Text
              className={`text-sm font-medium capitalize ${filter === tab ? 'text-on-primary' : 'text-steel'}`}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {visible.length === 0 ? (
        <EmptyState
          title="Inbox is clear"
          message="No notifications to show. Expiry alerts and staff requests will appear here."
        />
      ) : (
        visible.map((notification) => (
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
