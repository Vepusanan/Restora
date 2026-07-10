import 'dotenv/config';

export const serverEnv = {
  port: Number(process.env.PORT || 8787),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
  firebaseApiKey: process.env.FIREBASE_API_KEY || '',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
  requestTimeoutMs: 15_000,
  analyticsTimeoutMs: 45_000,
  maxQueryLength: 2000,
};

export function assertServerEnv(): void {
  if (!serverEnv.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is required in server/.env');
  }
  if (!serverEnv.firebaseApiKey || !serverEnv.firebaseProjectId) {
    throw new Error('FIREBASE_API_KEY and FIREBASE_PROJECT_ID are required in server/.env');
  }
}
