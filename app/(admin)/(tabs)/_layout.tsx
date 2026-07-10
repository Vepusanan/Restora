import { Tabs, useRouter } from 'expo-router';
import { FloatingTabBar } from '@components/chrome/FloatingTabBar';
import { HeaderBackButton } from '@components/chrome/HeaderBackButton';
import { colors } from '@constants/theme';

export default function AdminTabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      tabBar={(props) => (
        <FloatingTabBar
          {...props}
          visibleRouteNames={['index', 'inventory', 'waste', 'more']}
          fab={{
            icon: 'add',
            label: 'Add batch',
            onPress: () => router.push('/(admin)/add-batch'),
            onLongPress: () => router.push('/(admin)/log-usage'),
          }}
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
        name="waste"
        options={{
          title: 'Waste',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="usage"
        options={{
          title: 'Usage',
          href: null,
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          href: null,
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          href: null,
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI Assistant',
          href: null,
          headerLeft: () => <HeaderBackButton />,
        }}
      />
    </Tabs>
  );
}
