import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AiInsightCard } from '@components/analytics/AiInsightCard';
import { AiRecommendationList } from '@components/analytics/AiRecommendationList';
import { Button } from '@components/ui/Button';
import { EmptyState } from '@components/ui/EmptyState';
import { Icon } from '@components/ui/Icon';
import { InlineError } from '@components/ui/InlineError';
import { colors, radius, spacing } from '@constants/theme';
import type { AiAnalyticsReport, FinancialDateRange } from '@/types';

type Props = {
  report: AiAnalyticsReport | null;
  loadingCache: boolean;
  generating: boolean;
  error: string | null;
  range: FinancialDateRange;
  onGenerate: () => void;
};

function formatWhen(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

/** Admin AI Insights panel — manual generate, cached display, never blocks dashboard. */
export function AiInsightsPanel({
  report,
  loadingCache,
  generating,
  error,
  range,
  onGenerate,
}: Props) {
  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <View style={styles.titleRow}>
            <Icon name="sparkles" size={20} color={colors.forest} />
            <Text style={styles.title}>AI Insights</Text>
          </View>
          <Text style={styles.subtitle}>
            Gemini analyzes inventory, waste, cost, and expiry for {range.startDate} →{' '}
            {range.endDate}. Insights refresh only when you generate them.
          </Text>
        </View>
      </View>

      <Button
        title={report ? 'Refresh insights' : 'Generate insights'}
        icon="sparkles-outline"
        onPress={onGenerate}
        loading={generating}
        disabled={generating}
      />

      <InlineError message={error || undefined} />

      {generating ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.forest} />
          <Text style={styles.loadingText}>Analyzing restaurant data…</Text>
        </View>
      ) : null}

      {!generating && loadingCache ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.forest} />
          <Text style={styles.loadingText}>Loading saved insights…</Text>
        </View>
      ) : null}

      {!generating && !loadingCache && !report ? (
        <EmptyState
          title="No AI insights generated yet"
          description="Generate insights to get trends, warnings, and actionable recommendations from your live analytics data."
          icon="sparkles-outline"
        />
      ) : null}

      {report && !generating ? (
        <View style={styles.results}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>AI summary</Text>
            <Text style={styles.summaryText}>{report.summary}</Text>
            <Text style={styles.meta}>
              Generated {formatWhen(report.generatedAt)}
              {report.model ? ` · ${report.model}` : ''}
            </Text>
          </View>

          {report.insights.map((insight, index) => (
            <AiInsightCard key={`${insight.title}-${index}`} insight={insight} />
          ))}

          <AiRecommendationList items={report.recommendations} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: { gap: spacing.sm },
  headerCopy: { gap: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: 20, fontWeight: '800', color: colors.forest },
  subtitle: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loadingText: { color: colors.textSecondary, fontWeight: '600' },
  results: { gap: spacing.md },
  summaryCard: {
    backgroundColor: colors.forest,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  summaryLabel: {
    color: colors.lime,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryText: {
    color: colors.textOnDark,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  meta: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
});
