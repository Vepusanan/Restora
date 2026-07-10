import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@constants/theme';
import { formatMoney } from '@utils/financial';

type Props = {
  totalValue: number;
  batchCount: number;
  calculatedAt: string;
  excludedExpired: number;
  excludedConsumed: number;
  excludedArchived: number;
};

export function InventoryValuationCard({
  totalValue,
  batchCount,
  calculatedAt,
  excludedExpired,
  excludedConsumed,
  excludedArchived,
}: Props) {
  const updated = calculatedAt.slice(0, 19).replace('T', ' ');

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Current inventory value</Text>
      <Text style={styles.value}>{formatMoney(totalValue)}</Text>
      <Text style={styles.meta}>
        {batchCount} active non-expired batch{batchCount === 1 ? '' : 'es'}
      </Text>
      <Text style={styles.meta}>Last updated: {updated}</Text>
      <Text style={styles.hint}>
        Excluded — expired: {excludedExpired}, consumed: {excludedConsumed}, archived:{' '}
        {excludedArchived}
      </Text>
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
    gap: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  value: { fontSize: 36, fontWeight: '800', color: colors.primary },
  meta: { fontSize: 14, color: colors.textSecondary },
  hint: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs },
});
