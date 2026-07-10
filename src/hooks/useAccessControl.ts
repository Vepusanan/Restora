import { useAuth } from '@hooks/useAuth';
import type { UserRole } from '@/types';
import { canAccessModule } from '@utils/rbac';

export type AccessDecision =
  | { state: 'loading' }
  | { state: 'unauthenticated' }
  | { state: 'pending' }
  | { state: 'rejected' }
  | { state: 'deactivated' }
  | { state: 'authenticated'; role: UserRole };

/** Central access decision used by route gates (FR-003, FR-005, FR-007, FR-008). */
export function useAccessControl(): AccessDecision {
  const { user, profile, initializing, profileLoading } = useAuth();

  if (initializing || (user && profileLoading && !profile)) {
    return { state: 'loading' };
  }

  if (!user) {
    return { state: 'unauthenticated' };
  }

  if (!profile) {
    return { state: 'loading' };
  }

  if (profile.status === 'pending') return { state: 'pending' };
  if (profile.status === 'rejected') return { state: 'rejected' };
  if (profile.status === 'deactivated') return { state: 'deactivated' };

  if (profile.status === 'approved') {
    return { state: 'authenticated', role: profile.role };
  }

  return { state: 'unauthenticated' };
}

export { canAccessModule };
