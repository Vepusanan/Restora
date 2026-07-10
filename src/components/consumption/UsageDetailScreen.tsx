import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@components/ui/Button';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { InlineError } from '@components/ui/InlineError';
import { LoadingState } from '@components/ui/LoadingState';
import { useAuth } from '@hooks/useAuth';
import { consumptionService } from '@services/consumption.service';
import { colors, spacing } from '@constants/theme';
import { formatConsumptionCost } from '@utils/consumption';
import type { InventoryUsageLog, ServiceError } from '@/types';

type Props = {
  basePath: '/(admin)' | '/(staff)';
};

export function UsageDetailScreen({ basePath }: Props) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile, isAdmin } = useAuth();
  const [log, setLog] = useState<InventoryUsageLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voidOpen, setVoidOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    return consumptionService.subscribeLog(id, (next) => {
      setLog(next);
      setLoading(false);
    });
  }, [id]);

  const onVoid = async () => {
    if (!log || !user?.uid || !profile?.restaurantId) return;
    setBusy(true);
    setError(null);
    try {
      const result = await consumptionService.voidUsageEntry({
        restaurantId: profile.restaurantId,
        userId: user.uid,
        usageLogId: log.id,
      });
      setVoidOpen(false);
      Alert.alert(
        'Entry voided',
        `Restored ${result.restoredQuantity} ${log.unit} to inventory.`,
      );
    } catch (err) {
      setError((err as ServiceError).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState message="Loading usage entry…" />;
  if (!log) {
    return (
      <View style={styles.screen}>
        <InlineError message="Usage entry not found" />
        <Button title="Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: log.ingredientName, headerShown: true }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <InlineError message={error || undefined} />

        <View style={styles.card}>
          <View style={[styles.badge, log.voided ? styles.badgeVoided : styles.badgeActive]}>
            <Text style={styles.badgeText}>{log.voided ? 'Voided' : 'Active'}</Text>
          </View>
          <Text style={styles.title}>{log.ingredientName}</Text>
          <Text style={styles.qty}>
            {log.quantityUsed} {log.unit}
          </Text>
          <Text style={styles.meta}>Category: {log.category}</Text>
          {log.notes ? <Text style={styles.meta}>Notes: {log.notes}</Text> : null}
          {isAdmin ? (
            <>
              <Text style={styles.meta}>Unit cost: {formatConsumptionCost(log.unitCost)}</Text>
              <Text style={styles.cost}>
                Consumption cost: {formatConsumptionCost(log.consumptionCost)}
              </Text>
            </>
          ) : null}
          <Text style={styles.meta}>Used by: {log.usedByName || log.usedBy}</Text>
          <Text style={styles.meta}>
            Timestamp: {log.usedAt.slice(0, 19).replace('T', ' ')}
          </Text>
          <Text style={styles.meta}>Batch ID: {log.batchId}</Text>
          <Text style={styles.meta}>Usage group: {log.usageGroupId}</Text>
          {log.voided ? (
            <>
              <Text style={styles.meta}>Voided by: {log.voidedBy}</Text>
              <Text style={styles.meta}>
                Voided at: {log.voidedAt?.slice(0, 19).replace('T', ' ')}
              </Text>
            </>
          ) : null}
        </View>

        <Button
          title="View source batch"
          variant="secondary"
          onPress={() => router.push(`${basePath}/batch/${log.batchId}` as never)}
        />

        {isAdmin && !log.voided ? (
          <Button title="Void entry" variant="secondary" onPress={() => setVoidOpen(true)} />
        ) : null}

        <Button
          title="Back to usage"
          variant="ghost"
          onPress={() => router.replace(`${basePath}/(tabs)/usage` as never)}
        />
      </ScrollView>

      <ConfirmDialog
        visible={voidOpen}
        title="Void usage entry?"
        message={`This restores ${log.quantityUsed} ${log.unit} to inventory. The history entry is kept.`}
        confirmLabel="Void entry"
        destructive
        loading={busy}
        onConfirm={() => void onVoid()}
        onCancel={() => setVoidOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginBottom: spacing.xs,
  },
  badgeActive: { backgroundColor: colors.primaryLight },
  badgeVoided: { backgroundColor: '#E2E8F0' },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.text },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  qty: { fontSize: 28, fontWeight: '800', color: colors.forest },
  meta: { fontSize: 14, color: colors.textSecondary },
  cost: { fontSize: 16, fontWeight: '700', color: colors.text },
});
