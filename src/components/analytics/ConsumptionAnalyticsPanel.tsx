import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@constants/theme';
import { formatMoney } from '@utils/financial';
import type {
  ConsumptionByCategoryRow,
  ConsumptionTrendPoint,
  InventoryTurnoverRow,
  TopConsumedIngredient,
} from '@/types';

type Props = {
  currency?: string;
  totalConsumptionCost: number;
  trends: ConsumptionTrendPoint[];
  topConsumed: TopConsumedIngredient[];
  byCategory: ConsumptionByCategoryRow[];
  turnover: InventoryTurnoverRow[];
};

export function ConsumptionAnalyticsPanel({
  currency = 'USD',
  totalConsumptionCost,
  trends,
  topConsumed,
  byCategory,
  turnover,
}: Props) {
  const maxTrend = Math.max(...trends.map((point) => point.totalCost), 0);
  const fastMovers = turnover.filter((row) => row.turnoverRatio >= 1).slice(0, 5);
  const slowMovers = [...turnover]
    .filter((row) => row.remainingQuantity > 0)
    .sort((a, b) => a.turnoverRatio - b.turnoverRatio)
    .slice(0, 5);

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Consumption analytics</Text>
      <Text style={styles.sub}>
        Kitchen usage only — separate from waste loss. Includes turnover and category mix.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Consumption cost</Text>
        <Text style={styles.value}>{formatMoney(totalConsumptionCost, currency)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Consumption trend</Text>
        {trends.length === 0 ? (
          <Text style={styles.empty}>No usage in this range</Text>
        ) : (
          trends.map((point) => {
            const width = maxTrend > 0 ? Math.round((point.totalCost / maxTrend) * 100) : 0;
            return (
              <View key={point.key} style={styles.barRow}>
                <Text style={styles.meta}>
                  {point.label} · {formatMoney(point.totalCost, currency)}
                </Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${width}%` }]} />
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Most used ingredients</Text>
        {topConsumed.length === 0 ? (
          <Text style={styles.empty}>No consumption ranked yet</Text>
        ) : (
          topConsumed.map((row) => (
            <Text key={row.ingredientKey} style={styles.row}>
              #{row.rank} {row.ingredientName} · {row.quantityUsed} {row.unit} ·{' '}
              {formatMoney(row.totalCost, currency)}
            </Text>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>By category</Text>
        {byCategory.length === 0 ? (
          <Text style={styles.empty}>No category usage</Text>
        ) : (
          byCategory.map((row) => (
            <Text key={row.category} style={styles.row}>
              {row.category} · {row.eventCount} events · {formatMoney(row.totalCost, currency)}
            </Text>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Fast-moving inventory</Text>
        {fastMovers.length === 0 ? (
          <Text style={styles.empty}>No fast movers in range</Text>
        ) : (
          fastMovers.map((row) => (
            <Text key={row.ingredientKey} style={styles.row}>
              {row.ingredientName} · turnover {row.turnoverRatio.toFixed(2)} · avg/day{' '}
              {row.averageDailyConsumption.toFixed(2)} {row.unit}
            </Text>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Slow-moving inventory</Text>
        {slowMovers.length === 0 ? (
          <Text style={styles.empty}>No slow movers in range</Text>
        ) : (
          slowMovers.map((row) => (
            <Text key={row.ingredientKey} style={styles.row}>
              {row.ingredientName} · remaining {row.remainingQuantity} {row.unit} · turnover{' '}
              {row.turnoverRatio.toFixed(2)}
            </Text>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  heading: { fontSize: 20, fontWeight: '800', color: colors.text },
  sub: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  value: { fontSize: 24, fontWeight: '800', color: colors.forest },
  row: { fontSize: 13, color: colors.text, lineHeight: 20 },
  meta: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  empty: { fontSize: 13, color: colors.textSecondary },
  barRow: { gap: 4, marginBottom: 6 },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.forest,
  },
});
