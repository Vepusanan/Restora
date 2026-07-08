const requiredEnvVars = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
] as const;

function getEnvVar(key: (typeof requiredEnvVars)[number]): string {
  const value = process.env[key];

  if (!value || value.startsWith('your_')) {
    throw new Error(
      `Missing or placeholder env var: ${key}. Copy .env.example to .env and add your Firebase config.`,
    );
  }

  return value;
}

function getOptionalEnvVar(key: string): string | undefined {
  const value = process.env[key];

  if (!value || value.startsWith('your_')) {
    return undefined;
  }

  return value;
}

export const env = {
  firebase: {
    apiKey: getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: getEnvVar('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: getEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnvVar('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnvVar('EXPO_PUBLIC_FIREBASE_APP_ID'),
  },
  gemini: {
    apiKey: getOptionalEnvVar('EXPO_PUBLIC_GEMINI_API_KEY'),
  },
};
