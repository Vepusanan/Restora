import { create } from 'zustand';
import type {
  AuthUser,
  AsyncStatus,
  ServiceError,
  UserProfile,
} from '@/types';
import {
  authService,
  type AdminRegisterInput,
  type StaffRegisterInput,
} from '@services/auth.service';

type AuthState = {
  user: AuthUser | null;
  profile: UserProfile | null;
  status: AsyncStatus;
  initializing: boolean;
  profileLoading: boolean;
  error: ServiceError | null;
  lastRestaurantCode: string | null;
  setUser: (user: AuthUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setInitializing: (value: boolean) => void;
  setProfileLoading: (value: boolean) => void;
  clearError: () => void;
  clearSession: () => void;
  login: (email: string, password: string) => Promise<void>;
  registerAdmin: (input: AdminRegisterInput) => Promise<string>;
  registerStaff: (input: StaffRegisterInput) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  status: 'idle',
  initializing: true,
  profileLoading: false,
  error: null,
  lastRestaurantCode: null,

  setUser: (user) =>
    set({
      user,
      initializing: false,
      ...(user ? {} : { profile: null, profileLoading: false }),
    }),

  setProfile: (profile) => set({ profile, profileLoading: false }),

  setInitializing: (initializing) => set({ initializing }),

  setProfileLoading: (profileLoading) => set({ profileLoading }),

  clearError: () => set({ error: null }),

  clearSession: () =>
    set({
      user: null,
      profile: null,
      status: 'idle',
      profileLoading: false,
      lastRestaurantCode: null,
    }),

  login: async (email, password) => {
    set({ status: 'loading', error: null });
    try {
      const user = await authService.login(email, password);
      set({ user, status: 'success' });
    } catch (error) {
      set({ status: 'error', error: error as ServiceError });
      throw error;
    }
  },

  registerAdmin: async (input) => {
    set({ status: 'loading', error: null });
    try {
      const result = await authService.registerAdmin(input);
      set({
        user: result.authUser,
        status: 'success',
        lastRestaurantCode: result.restaurantCode,
      });
      return result.restaurantCode;
    } catch (error) {
      set({ status: 'error', error: error as ServiceError });
      throw error;
    }
  },

  registerStaff: async (input) => {
    set({ status: 'loading', error: null });
    try {
      const user = await authService.registerStaff(input);
      set({ user, status: 'success' });
    } catch (error) {
      set({ status: 'error', error: error as ServiceError });
      throw error;
    }
  },

  forgotPassword: async (email) => {
    set({ status: 'loading', error: null });
    try {
      await authService.forgotPassword(email);
      set({ status: 'success' });
    } catch (error) {
      set({ status: 'error', error: error as ServiceError });
      throw error;
    }
  },

  logout: async () => {
    set({ status: 'loading', error: null });
    try {
      await authService.logout();
      get().clearSession();
    } catch (error) {
      set({ status: 'error', error: error as ServiceError });
      throw error;
    }
  },
}));
