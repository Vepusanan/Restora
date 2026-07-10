import {
  doc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseAuth } from '@services/firebase/auth';
import { getDb } from '@services/firebase/firestore';
import { env } from '@config/env';
import { COLLECTIONS } from '@constants/auth';
import { createServiceError, toServiceError } from '@utils/errors';
import { AI_ANALYTICS_TIMEOUT_MS } from '@/types';
import type { AiAnalyticsReport, FinancialDateRange } from '@/types';

function mapReport(data: Record<string, unknown>, restaurantId: string): AiAnalyticsReport {
  return {
    restaurantId: String(data.restaurantId || restaurantId),
    summary: String(data.summary || ''),
    insights: Array.isArray(data.insights) ? (data.insights as AiAnalyticsReport['insights']) : [],
    recommendations: Array.isArray(data.recommendations)
      ? (data.recommendations as AiAnalyticsReport['recommendations'])
      : [],
    model: String(data.model || 'gemini'),
    generatedAt: String(data.generatedAt || ''),
    dataRange: {
      startDate: String((data.dataRange as { startDate?: string } | undefined)?.startDate || ''),
      endDate: String((data.dataRange as { endDate?: string } | undefined)?.endDate || ''),
    },
    createdBy: data.createdBy ? String(data.createdBy) : undefined,
    expiresAt: data.expiresAt ? String(data.expiresAt) : undefined,
  };
}

/**
 * Admin AI Analytics client — proxy only; Gemini key never in the app.
 */
export const aiAnalyticsService = {
  subscribe(
    restaurantId: string,
    onNext: (report: AiAnalyticsReport | null) => void,
  ): Unsubscribe {
    return onSnapshot(
      doc(getDb(), COLLECTIONS.aiAnalytics, restaurantId),
      (snap) => {
        if (!snap.exists()) {
          onNext(null);
          return;
        }
        onNext(mapReport(snap.data() as Record<string, unknown>, restaurantId));
      },
      (error) => {
        console.error('AI analytics listener error', error);
        onNext(null);
      },
    );
  },

  async generate(range?: FinancialDateRange): Promise<AiAnalyticsReport> {
    const user = getFirebaseAuth().currentUser;
    if (!user) {
      throw createServiceError('unauthenticated', 'Sign in required to use AI features');
    }

    try {
      const idToken = await user.getIdToken();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), AI_ANALYTICS_TIMEOUT_MS);

      try {
        const response = await fetch(`${env.aiApiUrl}/ai/analytics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            startDate: range?.startDate,
            endDate: range?.endDate,
          }),
          signal: controller.signal,
        });

        const payload = (await response.json().catch(() => ({}))) as Record<string, unknown> & {
          message?: string;
          code?: string;
        };

        if (!response.ok) {
          throw createServiceError(
            payload.code || 'internal',
            payload.message || 'AI analytics unavailable. Please try again.',
          );
        }

        if (!payload.summary) {
          throw createServiceError(
            'internal',
            'AI analytics unavailable. Please try again.',
          );
        }

        return mapReport(payload, String(payload.restaurantId || ''));
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
          'AI analytics unavailable. Please try again.',
        );
      }
      throw toServiceError(error, 'AI analytics unavailable. Please try again.');
    }
  },
};
