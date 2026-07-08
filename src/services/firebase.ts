import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  browserLocalPersistence,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import { env } from '@/src/config/env';

const firebaseConfig = env.firebase;

function createFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
}

function createFirebaseAuth(app: FirebaseApp): Auth {
  if (Platform.OS === 'web') {
    try {
      return initializeAuth(app, {
        persistence: browserLocalPersistence,
      });
    } catch {
      return getAuth(app);
    }
  }

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
