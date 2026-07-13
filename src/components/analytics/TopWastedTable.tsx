import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@constants/theme';
import { formatMoney } from '@utils/financial';
import type { TopWastedIngredient } from '@/types';

type Props = {
  rows: TopWastedIngredient[];
  currency?: string;
};

export function TopWastedTable({ rows, currency = 'USD' }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Top wasted ingredients</Text>
      {rows.length === 0 ? (
        <Text style={styles.empty}>No waste ranking data for this range.</Text>
      ) : (
        rows.map((row) => (
          <View key={row.ingredientKey} style={styles.row}>
            <View style={styles.rank}>
              <Text style={styles.rankText}>{row.rank}</Text>
            </View>
            <View style={styles.body}>
              <Text style={styles.name}>{row.ingredientName}</Text>
              <Text style={styles.meta}>
                {row.eventCount} event{row.eventCount === 1 ? '' : 's'} · {row.percentage.toFixed(1)}%
              </Text>
            </View>
            <Text style={styles.loss}>{formatMoney(row.totalLoss, currency)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  empty: { fontSize: 14, color: colors.textSecondary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontSize: 13, fontWeight: '800', color: colors.primaryDark },
  body: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.textSecondary },
  loss: { fontSize: 15, fontWeight: '800', color: colors.danger },
});
