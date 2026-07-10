/**
 * Gemini configuration for Cloud Functions.
 * Keys are read from environment / Secret Manager — never from the mobile client.
 */
export const geminiConfig = {
  /** Max prompt length accepted by the callable */
  maxPromptLength: 4000,
  /** Soft rate-limit window (per uid) in memory of a warm instance */
  rateLimit: {
    windowMs: 60_000,
    maxRequests: 20,
  },
  defaultModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
};

export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured on Cloud Functions');
  }
  return key;
}
