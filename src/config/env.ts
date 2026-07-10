/**
 * Client-safe environment configuration.
 * Only EXPO_PUBLIC_* values are available in the app bundle.
 */
import Constants from 'expo-constants';

type Extra = Record<string, string | undefined>;

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

function fromExtra(key: string): string {
  const value = extra[key];
  return value && value.length > 0 ? value : '';
}

export const env = {
  firebase: {
    apiKey:
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY || fromExtra('EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain:
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      fromExtra('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId:
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
      fromExtra('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket:
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      fromExtra('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      fromExtra('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || fromExtra('EXPO_PUBLIC_FIREBASE_APP_ID'),
  },
  functionsRegion:
    process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION ||
    fromExtra('EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION') ||
    'us-central1',
  /**
   * When false (default without Blaze), waste/staff callables are skipped and
   * Firestore transactions + security rules are used instead.
   * Set EXPO_PUBLIC_USE_CALLABLE_FUNCTIONS=true after deploying Cloud Functions.
   */
  useCallableFunctions:
    (process.env.EXPO_PUBLIC_USE_CALLABLE_FUNCTIONS ||
      fromExtra('EXPO_PUBLIC_USE_CALLABLE_FUNCTIONS') ||
      'false') === 'true',
  /** Local/secure AI proxy base URL (never includes Gemini key). */
  aiApiUrl: (
    process.env.EXPO_PUBLIC_AI_API_URL ||
    fromExtra('EXPO_PUBLIC_AI_API_URL') ||
    'http://localhost:8787'
  ).replace(/\/$/, ''),
} as const;

export function isFirebaseConfigured(): boolean {
  return Boolean(
    env.firebase.apiKey &&
      env.firebase.authDomain &&
      env.firebase.projectId &&
      env.firebase.appId,
  );
}
