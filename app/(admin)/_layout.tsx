import { Redirect, Stack } from 'expo-router';
import { HeaderBackButton } from '@components/chrome/HeaderBackButton';
import { LoadingState } from '@components/ui/LoadingState';
import { useAccessControl } from '@hooks/useAccessControl';
import { routes } from '@navigation/routes';
import { colors } from '@constants/theme';

export default function AdminLayout() {
  const access = useAccessControl();

  if (access.state === 'loading') {
    return <LoadingState />;
  }

  if (access.state === 'unauthenticated' || access.state === 'deactivated') {
    return <Redirect href={routes.login} />;
  }

  if (access.state === 'pending') {
    return <Redirect href={routes.pending} />;
  }

  if (access.state === 'rejected') {
    return <Redirect href={routes.rejected} />;
  }

  if (access.state === 'authenticated' && access.role !== 'admin') {
    return <Redirect href={routes.staffHome} />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.forest,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* More-hub destinations always return to More, not Home */}
      <Stack.Screen
        name="cost"
        options={{
          title: 'Cost & expense',
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="staff"
        options={{
          title: 'Staff',
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="audit"
        options={{
          title: 'Audit history',
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerLeft: () => <HeaderBackButton />,
        }}
      />
    </Stack>
  );
}
