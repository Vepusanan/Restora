import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ExpiryBadge } from '@components/inventory/ExpiryBadge';
import { FifoBadge } from '@components/inventory/FifoBadge';
import { colors, spacing } from '@constants/theme';
import type { InventoryBatch } from '@/types';

type Props = {
  batch: InventoryBatch;
  isFifo: boolean;
  now: Date;
  amberDays?: number;
  onPress: () => void;
};

export function BatchCard({ batch, isFifo, now, amberDays, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.qty}>
          {batch.quantity} {batch.unit}
        </Text>
        <View style={styles.badges}>
          {isFifo ? <FifoBadge /> : null}
          <ExpiryBadge expiryDate={batch.expiryDate} now={now} amberDays={amberDays} />
        </View>
      </View>
      <Text style={styles.meta}>Supplier: {batch.supplier}</Text>
      <Text style={styles.meta}>
        Received {batch.dateReceived} · Expires {batch.expiryDate}
      </Text>
      <Text style={styles.meta}>Unit cost: ${batch.unitCost.toFixed(2)}</Text>
      {batch.consumed ? <Text style={styles.flag}>Consumed</Text> : null}
      {batch.archived ? <Text style={styles.flag}>Archived</Text> : null}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  qty: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  badges: {
    gap: spacing.xs,
    alignItems: 'flex-end',
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  flag: {
    marginTop: spacing.xs,
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
  },
});
