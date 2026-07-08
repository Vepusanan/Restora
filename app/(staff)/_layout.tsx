import { Stack } from 'expo-router';

export default function StaffLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add-batch" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="waste-log" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
    </Stack>
  );
}
