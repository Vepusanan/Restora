import { Redirect } from 'expo-router';
import { LoadingState } from '@components/ui/LoadingState';
import { SetupRequiredScreen } from '@screens/SetupRequiredScreen';
import { isFirebaseConfigured } from '@config/env';
import { useAccessControl } from '@hooks/useAccessControl';
import { routes } from '@navigation/routes';

/**
 * Root auth gate (FR-003, FR-005, FR-007, FR-008).
 */
export default function Index() {
  const access = useAccessControl();

  if (!isFirebaseConfigured()) {
    return <SetupRequiredScreen />;
  }

  if (access.state === 'loading') {
    return <LoadingState message="Starting Restora…" />;
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

  if (access.state === 'authenticated' && access.role === 'admin') {
    return <Redirect href={routes.adminHome} />;
  }

  return <Redirect href={routes.staffInventory} />;
}
