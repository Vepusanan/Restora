import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { MOCK_RESTAURANT } from '@/src/data/mock';
import { signIn, signUp, logOut, subscribeToAuthChanges } from '@/src/services/auth.service';
import type { ApprovalStatus, SessionUser, UserRole } from '@/src/types/restora';
import { getErrorMessage } from '@/src/utils/errors';

const SESSION_KEY = '@restora/session';

type SessionContextValue = {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemo: (role: UserRole) => void;
  registerAdmin: (payload: {
    email: string;
    password: string;
    restaurantName: string;
    displayName: string;
  }) => Promise<string>;
  registerStaff: (payload: {
    email: string;
    password: string;
    displayName: string;
    restaurantCode: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

function generateRestaurantCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `RST-${code}`;
}

function buildDemoUser(role: UserRole): SessionUser {
  return {
    id: role === 'admin' ? 'demo_admin' : 'demo_staff',
    email: role === 'admin' ? 'admin@restora.demo' : 'staff@restora.demo',
    displayName: role === 'admin' ? 'Admin Demo' : 'Staff Demo',
    role,
    approvalStatus: 'approved',
    restaurantId: MOCK_RESTAURANT.id,
    restaurantName: MOCK_RESTAURANT.name,
    restaurantCode: MOCK_RESTAURANT.code,
  };
}

async function persistSession(user: SessionUser | null) {
  if (user) {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    await AsyncStorage.removeItem(SESSION_KEY);
  }
}

async function loadPersistedSession(): Promise<SessionUser | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

type SessionProviderProps = {
  children: ReactNode;
};

export function SessionProvider({ children }: SessionProviderProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const persisted = await loadPersistedSession();
      if (!mounted) return;
      if (persisted) {
        setUser(persisted);
      }
      setIsLoading(false);
    }

    void bootstrap();

    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      if (!firebaseUser || !mounted) return;

      loadPersistedSession().then((persisted) => {
        if (!mounted) return;
        if (persisted) {
          setUser(persisted);
        }
      });
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await signIn({ email, password });
      const session: SessionUser = {
        id: 'firebase_user',
        email,
        displayName: email.split('@')[0],
        role: email.includes('staff') ? 'staff' : 'admin',
        approvalStatus: 'approved',
        restaurantId: MOCK_RESTAURANT.id,
        restaurantName: MOCK_RESTAURANT.name,
        restaurantCode: MOCK_RESTAURANT.code,
      };
      setUser(session);
      await persistSession(session);
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  }, []);

  const loginAsDemo = useCallback((role: UserRole) => {
    const session = buildDemoUser(role);
    setUser(session);
    void persistSession(session);
  }, []);

  const registerAdmin = useCallback(
    async (payload: {
      email: string;
      password: string;
      restaurantName: string;
      displayName: string;
    }) => {
      setError(null);
      const restaurantCode = generateRestaurantCode();
      try {
        await signUp({
          email: payload.email,
          password: payload.password,
          displayName: payload.displayName,
        });
      } catch (err) {
        // Firebase may fail in demo — continue with local session for UI
        if (!String(getErrorMessage(err)).includes('demo')) {
          // Allow UI flow even when Firebase unavailable
        }
      }

      const session: SessionUser = {
        id: `admin_${Date.now()}`,
        email: payload.email,
        displayName: payload.displayName,
        role: 'admin',
        approvalStatus: 'approved',
        restaurantId: `rest_${Date.now()}`,
        restaurantName: payload.restaurantName,
        restaurantCode,
      };
      setUser(session);
      await persistSession(session);
      return restaurantCode;
    },
    [],
  );

  const registerStaff = useCallback(
    async (payload: {
      email: string;
      password: string;
      displayName: string;
      restaurantCode: string;
    }) => {
      setError(null);
      const isValidCode =
        payload.restaurantCode.toUpperCase() === MOCK_RESTAURANT.code ||
        payload.restaurantCode.length >= 6;

      if (!isValidCode) {
        setError('Invalid restaurant code. Check with your manager.');
        throw new Error('Invalid restaurant code');
      }

      try {
        await signUp({
          email: payload.email,
          password: payload.password,
          displayName: payload.displayName,
        });
      } catch {
        // Placeholder: allow UI registration without Firebase
      }

      const session: SessionUser = {
        id: `staff_${Date.now()}`,
        email: payload.email,
        displayName: payload.displayName,
        role: 'staff',
        approvalStatus: 'pending' as ApprovalStatus,
        restaurantId: MOCK_RESTAURANT.id,
        restaurantName: MOCK_RESTAURANT.name,
        restaurantCode: payload.restaurantCode.toUpperCase(),
      };
      setUser(session);
      await persistSession(session);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logOut();
    } catch {
      // ignore
    }
    setUser(null);
    await persistSession(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      error,
      clearError,
      login,
      loginAsDemo,
      registerAdmin,
      registerStaff,
      logout,
    }),
    [user, isLoading, error, clearError, login, loginAsDemo, registerAdmin, registerStaff, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

export function useIsAdmin() {
  const { user } = useSession();
  return user?.role === 'admin';
}
