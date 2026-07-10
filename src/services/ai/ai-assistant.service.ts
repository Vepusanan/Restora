import { getFirebaseAuth } from '@services/firebase/auth';
import { env } from '@config/env';
import { createServiceError, toServiceError } from '@utils/errors';
import { AI_REQUEST_TIMEOUT_MS } from '@/types';
import type { AiAskResponse } from '@/types';

/**
 * Client AI gateway — calls the secure proxy only.
 * Gemini API key never ships in the app bundle (FR-042/043).
 */
export const aiAssistantService = {
  async ask(query: string): Promise<AiAskResponse> {
    const trimmed = query.trim();
    if (!trimmed) {
      throw createServiceError('restora/validation', 'Enter a question first.');
    }
    if (trimmed.length > 2000) {
      throw createServiceError(
        'restora/validation',
        'Question must be 2000 characters or fewer.',
      );
    }

    const user = getFirebaseAuth().currentUser;
    if (!user) {
      throw createServiceError('unauthenticated', 'Sign in required to use AI features');
    }

    try {
      const idToken = await user.getIdToken();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(`${env.aiApiUrl}/ai/ask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ query: trimmed }),
          signal: controller.signal,
        });

        const payload = (await response.json().catch(() => ({}))) as {
          text?: string;
          model?: string;
          role?: string;
          restaurantId?: string;
          message?: string;
          code?: string;
        };

        if (!response.ok) {
          throw createServiceError(
            payload.code || 'internal',
            payload.message ||
              'AI Assistant is currently unavailable. Please try again.',
          );
        }

        if (!payload.text?.trim()) {
          throw createServiceError(
            'internal',
            'AI Assistant is currently unavailable. Please try again.',
          );
        }

        return {
          text: payload.text.trim(),
          model: payload.model || 'gemini',
          role: payload.role,
          restaurantId: payload.restaurantId,
        };
      } finally {
        clearTimeout(timer);
      }
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        (error as { name?: string }).name === 'AbortError'
      ) {
        throw createServiceError(
          'deadline-exceeded',
          'AI Assistant is currently unavailable. Please try again.',
        );
      }
      throw toServiceError(
        error,
        'AI Assistant is currently unavailable. Please try again.',
      );
    }
  },
};
