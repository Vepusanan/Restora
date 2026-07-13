import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@constants/theme';
import { formatMoney } from '@utils/financial';
import type { WasteTrendPoint } from '@/types';

type Props = {
  title: string;
  points: WasteTrendPoint[];
  currency?: string;
  emptyMessage?: string;
};

export function WasteTrendChart({
  title,
  points,
  currency = 'USD',
  emptyMessage = 'No waste cost in this range',
}: Props) {
  const max = Math.max(...points.map((point) => point.totalLoss), 0);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {points.length === 0 ? (
        <Text style={styles.empty}>{emptyMessage}</Text>
      ) : (
        <View style={styles.bars}>
          {points.map((point) => {
            const heightPct = max > 0 ? Math.max(8, (point.totalLoss / max) * 100) : 0;
            return (
              <View key={point.key} style={styles.col}>
                <Text style={styles.amount}>{formatMoney(point.totalLoss, currency)}</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { height: `${heightPct}%` }]} />
                </View>
                <Text style={styles.label} numberOfLines={2}>
                  {point.label}
                </Text>
              </View>
            );
          })}
        </View>
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
    gap: spacing.md,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  empty: { fontSize: 14, color: colors.textSecondary },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    minHeight: 160,
    overflow: 'scroll',
  },
  col: {
    flex: 1,
    minWidth: 56,
    alignItems: 'center',
    gap: 6,
  },
  amount: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
  track: {
    width: '70%',
    height: 110,
    borderRadius: 8,
    backgroundColor: colors.border,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    backgroundColor: colors.danger,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  label: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
