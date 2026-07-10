import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { env, isFirebaseConfigured } from '@config/env';

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;

  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to .env and set EXPO_PUBLIC_FIREBASE_* values.',
    );
  }

  app = getApps().length > 0 ? getApp() : initializeApp(env.firebase);
  return app;
}
