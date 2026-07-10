import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@constants/theme';

function TabLabel({ label, color }: { label: string; color: string }) {
  return <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{label}</Text>;
}

export default function AdminTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: ({ color }) => <TabLabel label="Home" color={color} />,
        }}
      />
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
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarLabel: ({ color }) => <TabLabel label="Analytics" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI Assistant',
          tabBarLabel: ({ color }) => <TabLabel label="AI" color={color} />,
        }}
      />
    </Tabs>
  );
}
