import { useCallback, useEffect, useState } from 'react';
import { aiAnalyticsService } from '@services/ai/ai-analytics.service';
import { useAuth } from '@hooks/useAuth';
import { canAccessModule } from '@utils/rbac';
import type { AiAnalyticsReport, FinancialDateRange, ServiceError } from '@/types';

/**
 * Admin-only AI analytics cache + manual generate.
 * Does not auto-regenerate on realtime inventory/waste changes.
 */
export function useAiAnalytics(restaurantId: string | undefined) {
  const { profile, isAdmin } = useAuth();
  const allowed = isAdmin || canAccessModule(profile?.role, 'analytics');

  const [report, setReport] = useState<AiAnalyticsReport | null>(null);
  const [loadingCache, setLoadingCache] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed || !restaurantId) {
      setReport(null);
      setLoadingCache(false);
      return;
    }

    setLoadingCache(true);
    return aiAnalyticsService.subscribe(restaurantId, (next) => {
      setReport(next);
      setLoadingCache(false);
    });
  }, [allowed, restaurantId]);

  const generate = useCallback(
    async (range?: FinancialDateRange) => {
      if (!allowed) {
        setError('AI Analytics is available to restaurant admins only.');
        return null;
      }
      setGenerating(true);
      setError(null);
      try {
        const next = await aiAnalyticsService.generate(range);
        setReport(next);
        return next;
      } catch (err) {
        const message =
          (err as ServiceError).message || 'AI analytics unavailable. Please try again.';
        setError(message);
        return null;
      } finally {
        setGenerating(false);
      }
    },
    [allowed],
  );

  return {
    allowed,
    report,
    loadingCache,
    generating,
    error,
    generate,
    clearError: () => setError(null),
  };
}
