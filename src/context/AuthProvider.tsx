import { useEffect, useRef, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { authService } from '@services/auth.service';
import { userService } from '@services/user.service';
import { useAuthStore } from '@store/authStore';
import { isFirebaseConfigured } from '@config/env';
import { usePushNotifications } from '@hooks/usePushNotifications';

type Props = {
  children: ReactNode;
};

function PushNotificationsBridge() {
  usePushNotifications();
  return null;
}

/**
 * Keeps Firebase Auth + Firestore profile in sync.
 * Profile listener drives pending → approved redirects and forced logout on deactivation.
 */
export function AuthProvider({ children }: Props) {
  const setUser = useAuthStore((s) => s.setUser);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setInitializing = useAuthStore((s) => s.setInitializing);
  const setProfileLoading = useAuthStore((s) => s.setProfileLoading);
  const clearSession = useAuthStore((s) => s.clearSession);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const loggingOutRef = useRef(false);
  const loginAuditedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setInitializing(false);
      return;
    }

    const unsubscribe = authService.subscribe((nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        loginAuditedRef.current = null;
      }
    });

    return unsubscribe;
  }, [setUser, setProfile, setInitializing]);

  useEffect(() => {
    if (!user?.uid) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    const unsubscribe = userService.subscribeProfile(user.uid, async (nextProfile) => {
      if (!nextProfile) {
        setProfile(null);
        return;
      }

      if (nextProfile.status === 'deactivated') {
        setProfile(nextProfile);
        if (!loggingOutRef.current) {
          loggingOutRef.current = true;
          try {
            await logout();
          } finally {
            loggingOutRef.current = false;
          }
        }
        return;
      }

      setProfile(nextProfile);

      // FR-053 — one login audit per approved session.
      if (
        nextProfile.status === 'approved' &&
        loginAuditedRef.current !== nextProfile.uid
      ) {
        loginAuditedRef.current = nextProfile.uid;
        void import('@services/audit.service').then(({ auditService }) =>
          auditService.writeSafe({
            action: 'user_login',
            restaurantId: nextProfile.restaurantId,
            userId: nextProfile.uid,
            actor: {
              id: nextProfile.uid,
              name: nextProfile.displayName,
              role: nextProfile.role,
            },
            target: {
              collection: 'users',
              documentId: nextProfile.uid,
              name: nextProfile.displayName,
            },
            before: null,
            after: { signedIn: true, status: nextProfile.status },
          }),
        );
      }
    });

    return unsubscribe;
  }, [user?.uid, setProfile, setProfileLoading, logout]);

  useEffect(() => {
    if (!user || !profile || profile.status === 'deactivated') return;

    const onAppState = async (state: AppStateStatus) => {
      if (state !== 'active') return;
      try {
        await authService.refreshSession();
      } catch {
        if (!loggingOutRef.current) {
          loggingOutRef.current = true;
          try {
            clearSession();
            await authService.logout();
          } finally {
            loggingOutRef.current = false;
          }
        }
      }
    };

    const sub = AppState.addEventListener('change', onAppState);
    const interval = setInterval(() => {
      void onAppState('active');
    }, 45_000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [user, profile, clearSession]);

  return (
    <>
      <PushNotificationsBridge />
      {children}
    </>
  );
}
