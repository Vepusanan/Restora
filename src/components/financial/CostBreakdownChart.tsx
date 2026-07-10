import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@constants/theme';
import { formatMoney } from '@utils/financial';

type BarItem = {
  key: string;
  label: string;
  value: number;
};

type Props = {
  title: string;
  totalLabel: string;
  totalValue: number;
  items: BarItem[];
  emptyMessage?: string;
};

export function CostBreakdownChart({
  title,
  totalLabel,
  totalValue,
  items,
  emptyMessage = 'No data for this range',
}: Props) {
  const max = Math.max(...items.map((item) => item.value), 0);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.totalLabel}>{totalLabel}</Text>
      <Text style={styles.total}>{formatMoney(totalValue)}</Text>

      {items.length === 0 ? (
        <Text style={styles.empty}>{emptyMessage}</Text>
      ) : (
        <View style={styles.bars}>
          {items.slice(0, 12).map((item) => {
            const widthPct = max > 0 ? Math.max(6, (item.value / max) * 100) : 0;
            return (
              <View key={item.key} style={styles.row}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                  <Text style={styles.rowValue}>{formatMoney(item.value)}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${widthPct}%` }]} />
                </View>
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
    gap: spacing.sm,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  totalLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  total: { fontSize: 28, fontWeight: '800', color: colors.text },
  empty: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.sm },
  bars: { gap: spacing.md, marginTop: spacing.sm },
  row: { gap: spacing.xs },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  rowValue: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
});
