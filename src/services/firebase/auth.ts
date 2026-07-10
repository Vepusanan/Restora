import {
  getAuth,
  initializeAuth,
  type Auth,
  type Persistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getFirebaseApp } from './config';

let auth: Auth | null = null;

/**
 * React Native persistence is exported from the RN build of firebase/auth.
 * TypeScript resolves the web typings, so we load it at runtime on native.
 */
function createReactNativePersistence(): Persistence {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const authModule = require('firebase/auth') as {
    getReactNativePersistence?: (storage: typeof AsyncStorage) => Persistence;
  };

  if (!authModule.getReactNativePersistence) {
    throw new Error('React Native Auth persistence is unavailable');
  }

  return authModule.getReactNativePersistence(AsyncStorage);
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth;

  const app = getFirebaseApp();

  if (Platform.OS === 'web') {
    auth = getAuth(app);
    return auth;
  }

  try {
    auth = initializeAuth(app, {
      persistence: createReactNativePersistence(),
    });
  } catch {
    // Auth already initialized (Fast Refresh / HMR)
    auth = getAuth(app);
  }

  return auth;
}
