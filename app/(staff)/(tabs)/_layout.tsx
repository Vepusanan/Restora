import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { UnreadBadge } from '@components/notifications/UnreadBadge';
import { useUnreadNotificationCount } from '@hooks/useUnreadNotificationCount';
import { colors } from '@constants/theme';

function TabLabel({ label, color }: { label: string; color: string }) {
  return <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{label}</Text>;
}

function InboxLabel({ color }: { color: string }) {
  const unread = useUnreadNotificationCount();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <TabLabel label="Inbox" color={color} />
      <UnreadBadge count={unread} />
    </View>
  );
}

export default function StaffTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarLabel: ({ color }) => <TabLabel label="Inventory" color={color} />,
        }}
      />
      <Tabs.Screen
        name="waste"
        options={{
          title: 'Waste',
          tabBarLabel: ({ color }) => <TabLabel label="Waste" color={color} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarLabel: ({ color }) => <InboxLabel color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI Assistant',
          tabBarLabel: ({ color }) => <TabLabel label="AI" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: ({ color }) => <TabLabel label="Settings" color={color} />,
        }}
      />
    </Tabs>
  );
}
