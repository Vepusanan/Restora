import { useAuthStore } from '@store/authStore';
import type { UserRole, UserStatus } from '@/types';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const initializing = useAuthStore((s) => s.initializing);
  const profileLoading = useAuthStore((s) => s.profileLoading);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const lastRestaurantCode = useAuthStore((s) => s.lastRestaurantCode);
  const login = useAuthStore((s) => s.login);
  const registerAdmin = useAuthStore((s) => s.registerAdmin);
  const registerStaff = useAuthStore((s) => s.registerStaff);
  const logout = useAuthStore((s) => s.logout);
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const clearError = useAuthStore((s) => s.clearError);

  const role: UserRole | null = profile?.role ?? null;
  const userStatus: UserStatus | null = profile?.status ?? null;

  return {
    user,
    profile,
    initializing,
    profileLoading,
    status,
    error,
    lastRestaurantCode,
    role,
    userStatus,
    isAuthenticated: Boolean(user),
    isAdmin: role === 'admin' && userStatus === 'approved',
    isStaff: role === 'staff' && userStatus === 'approved',
    isPending: userStatus === 'pending',
    isRejected: userStatus === 'rejected',
    isReady: !initializing && (!user || !profileLoading),
    login,
    registerAdmin,
    registerStaff,
    logout,
    forgotPassword,
    clearError,
  };
}
