function assertEnvVar(value: string | undefined, name: string): string {
  if (!value || value.startsWith('your_')) {
    throw new Error(
      `Missing or placeholder env var: ${name}. Copy .env.example to .env and add your Firebase config.`,
    );
  }

  return value;
}

function getOptionalGeminiKey(): string | undefined {
  const value = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!value || value.startsWith('your_')) {
    return undefined;
  }

  return value;
}

export const env = {
  firebase: {
    apiKey: assertEnvVar(
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      'EXPO_PUBLIC_FIREBASE_API_KEY',
    ),
    authDomain: assertEnvVar(
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    ),
    projectId: assertEnvVar(
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    ),
    storageBucket: assertEnvVar(
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    ),
    messagingSenderId: assertEnvVar(
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    ),
    appId: assertEnvVar(
      process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      'EXPO_PUBLIC_FIREBASE_APP_ID',
    ),
  },
  gemini: {
    apiKey: getOptionalGeminiKey(),
  },
};
