import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@context/AuthProvider';
import { ErrorBoundary } from '@components/ui/ErrorBoundary';
import { WebFocusReset } from '@components/chrome/WebFocusReset';
import { colors } from '@constants/theme';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <WebFocusReset />
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </AuthProvider>
    </ErrorBoundary>
  );
}
