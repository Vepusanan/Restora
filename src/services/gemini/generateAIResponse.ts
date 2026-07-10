import { httpsCallable, getFunctions } from 'firebase/functions';
import { getFirebaseApp } from '../firebase/config';
import { env } from '@config/env';
import { toServiceError } from '@utils/errors';
import type { AiGenerateResponse } from '@/types';

/**
 * Client AI service — calls Cloud Functions only.
 * The Gemini API key never ships in the mobile bundle.
 */
export async function generateAIResponse(prompt: string): Promise<AiGenerateResponse> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw toServiceError(new Error('Prompt is required'), 'Prompt is required');
  }

  if (trimmed.length > 4000) {
    throw toServiceError(new Error('Prompt is too long'), 'Prompt must be 4000 characters or fewer');
  }

  try {
    const functions = getFunctions(getFirebaseApp(), env.functionsRegion);
    const callable = httpsCallable<{ prompt: string }, AiGenerateResponse>(
      functions,
      'generateContent',
    );
    const result = await callable({ prompt: trimmed });
    return result.data;
  } catch (error) {
    throw toServiceError(error, 'AI request failed');
  }
}
