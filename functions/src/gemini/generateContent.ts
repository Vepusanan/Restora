import { GoogleGenerativeAI } from '@google/generative-ai';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { geminiConfig, getGeminiApiKey } from './config';

const geminiApiKey = defineSecret('GEMINI_API_KEY');

/** Simple per-instance rate limiter (best-effort; use Redis/App Check in production). */
const requestLog = new Map<string, number[]>();

function assertRateLimit(uid: string): void {
  const now = Date.now();
  const windowStart = now - geminiConfig.rateLimit.windowMs;
  const recent = (requestLog.get(uid) ?? []).filter((ts) => ts > windowStart);

  if (recent.length >= geminiConfig.rateLimit.maxRequests) {
    throw new HttpsError(
      'resource-exhausted',
      'Too many AI requests. Please wait a moment and try again.',
    );
  }

  recent.push(now);
  requestLog.set(uid, recent);
}

function validatePrompt(prompt: unknown): string {
  if (typeof prompt !== 'string') {
    throw new HttpsError('invalid-argument', 'prompt must be a string');
  }

  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new HttpsError('invalid-argument', 'prompt is required');
  }

  if (trimmed.length > geminiConfig.maxPromptLength) {
    throw new HttpsError(
      'invalid-argument',
      `prompt must be ${geminiConfig.maxPromptLength} characters or fewer`,
    );
  }

  return trimmed;
}

export type GenerateContentResult = {
  text: string;
  model: string;
};

/**
 * Authenticated callable that proxies prompts to Gemini.
 * Mobile clients must never call Gemini directly.
 */
export const generateContent = onCall(
  {
    secrets: [geminiApiKey],
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request): Promise<GenerateContentResult> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in required to use AI features');
    }

    assertRateLimit(request.auth.uid);
    const prompt = validatePrompt(request.data?.prompt);
    const modelName = geminiConfig.defaultModel;

    try {
      // Prefer secret binding; fall back to process.env for local emulator.
      process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || geminiApiKey.value();
      const genAI = new GoogleGenerativeAI(getGeminiApiKey());
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text()?.trim();

      if (!text) {
        throw new HttpsError('internal', 'Gemini returned an empty response');
      }

      return { text, model: modelName };
    } catch (error) {
      if (error instanceof HttpsError) throw error;

      console.error('generateContent failed', error);
      throw new HttpsError('internal', 'Failed to generate AI response');
    }
  },
);
