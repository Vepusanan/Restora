import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth, type Persistence } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

import { env } from '@/src/config/env';

const firebaseConfig = env.firebase;

function createFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
}

function getReactNativePersistence(storage: typeof AsyncStorage): Persistence {
  const { getReactNativePersistence: getPersistence } =
    require('@firebase/auth/dist/rn/index.js') as {
      getReactNativePersistence: (value: typeof AsyncStorage) => Persistence;
    };

  return getPersistence(storage);
}

function createFirebaseAuth(app: FirebaseApp): Auth {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

const app = createFirebaseApp();

export const auth = createFirebaseAuth(app);
export const db = getFirestore(app);
