import { Tabs, useRouter } from 'expo-router';
import { FloatingTabBar } from '@components/chrome/FloatingTabBar';
import { useUnreadNotificationCount } from '@hooks/useUnreadNotificationCount';
import { colors } from '@constants/theme';

export default function StaffTabsLayout() {
  const router = useRouter();
  const unread = useUnreadNotificationCount();

  return (
    <Tabs
      tabBar={(props) => (
        <FloatingTabBar
          {...props}
          visibleRouteNames={['index', 'inventory', 'inbox', 'settings']}
          fab={{
            icon: 'restaurant',
            label: 'Log usage',
            onPress: () => router.push('/(staff)/log-usage'),
            onLongPress: () => router.push('/(staff)/log-waste'),
          }}
          badgeRoutes={{ inbox: unread }}
        />
      )}
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.forest,
        headerTitleStyle: { fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="waste"
        options={{
          title: 'Waste',
          href: null,
        }}
      />
      <Tabs.Screen
        name="usage"
        options={{
          title: 'Usage',
          href: null,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI Assistant',
          href: null,
        }}
      />
    </Tabs>
  );
}
