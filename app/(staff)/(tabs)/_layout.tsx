import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@constants/theme';

function TabLabel({ label, color }: { label: string; color: string }) {
  return <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{label}</Text>;
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
    </Tabs>
  );
}
