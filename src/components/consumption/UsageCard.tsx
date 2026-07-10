import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@constants/theme';
import { formatConsumptionCost } from '@utils/consumption';
import type { InventoryUsageLog } from '@/types';

type Props = {
  log: InventoryUsageLog;
  onPress: () => void;
  showFinancials?: boolean;
};

export function UsageCard({ log, onPress, showFinancials = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, log.voided && styles.voided]}
      accessibilityRole="button"
    >
      <View style={styles.row}>
        <Text style={styles.title}>{log.ingredientName}</Text>
        <View style={[styles.badge, log.voided ? styles.badgeVoided : styles.badgeActive]}>
          <Text
            style={[styles.badgeText, log.voided ? styles.badgeTextVoided : styles.badgeTextActive]}
          >
            {log.voided ? 'Voided' : 'Active'}
          </Text>
        </View>
      </View>
      <Text style={styles.body}>
        {log.quantityUsed} {log.unit} · {log.category}
      </Text>
      <Text style={styles.meta}>
        {showFinancials ? `Cost ${formatConsumptionCost(log.consumptionCost)} · ` : ''}
        {log.usedByName || 'Unknown'}
      </Text>
      <Text style={styles.meta}>{log.usedAt.slice(0, 19).replace('T', ' ')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  voided: {
    opacity: 0.72,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  body: { fontSize: 14, color: colors.text, fontWeight: '600' },
  meta: { fontSize: 12, color: colors.textSecondary },
  badge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeActive: { backgroundColor: colors.primaryLight },
  badgeVoided: { backgroundColor: '#E2E8F0' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextActive: { color: colors.primaryDark },
  badgeTextVoided: { color: colors.textSecondary },
});
