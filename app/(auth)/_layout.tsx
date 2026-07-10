import { Redirect, Stack, useSegments } from 'expo-router';
import { LoadingState } from '@components/ui/LoadingState';
import { useAccessControl } from '@hooks/useAccessControl';
import { routes } from '@navigation/routes';

export default function AuthLayout() {
  const access = useAccessControl();
  const segments = useSegments();
  const segmentList = segments as string[];
  const onPending = segmentList.includes('pending');
  const onRejected = segmentList.includes('rejected');

  if (access.state === 'loading') {
    return <LoadingState />;
  }

  if (access.state === 'pending' && !onPending) {
    return <Redirect href={routes.pending} />;
  }

  if (access.state === 'rejected' && !onRejected) {
    return <Redirect href={routes.rejected} />;
  }

  if (access.state === 'authenticated') {
    return (
      <Redirect
        href={access.role === 'admin' ? routes.adminHome : routes.staffInventory}
      />
    );
  }

  // Allow pending/rejected screens to render for those states.
  if (
    (access.state === 'pending' && onPending) ||
    (access.state === 'rejected' && onRejected) ||
    access.state === 'unauthenticated' ||
    access.state === 'deactivated'
  ) {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      />
    );
  }

  return <LoadingState />;
}
