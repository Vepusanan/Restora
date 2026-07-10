import { Redirect, Stack } from 'expo-router';
import { LoadingState } from '@components/ui/LoadingState';
import { useAccessControl } from '@hooks/useAccessControl';
import { routes } from '@navigation/routes';
import { colors } from '@constants/theme';

export default function StaffLayout() {
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

  if (access.state === 'authenticated' && access.role !== 'staff') {
    return <Redirect href={routes.adminHome} />;
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
    </Stack>
  );
}
