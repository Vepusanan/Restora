import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@components/ui/Button';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { InlineError } from '@components/ui/InlineError';
import { LoadingState } from '@components/ui/LoadingState';
import { useAuth } from '@hooks/useAuth';
import { wasteService } from '@services/waste.service';
import { colors, spacing } from '@constants/theme';
import { formatCostLoss } from '@utils/waste';
import type { ServiceError, WasteLog } from '@/types';

type Props = {
  basePath: '/(admin)' | '/(staff)';
};

export function WasteDetailScreen({ basePath }: Props) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile, isAdmin } = useAuth();
  const [log, setLog] = useState<WasteLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voidOpen, setVoidOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    return wasteService.subscribeLog(id, (next) => {
      setLog(next);
      setLoading(false);
    });
  }, [id]);

  const onVoid = async () => {
    if (!log || !user?.uid || !profile?.restaurantId) return;
    setBusy(true);
    setError(null);
    try {
      const result = await wasteService.voidWasteEntry({
        restaurantId: profile.restaurantId,
        userId: user.uid,
        wasteLogId: log.id,
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

  if (loading) return <LoadingState message="Loading waste entry…" />;
  if (!log) {
    return (
      <View style={styles.screen}>
        <InlineError message="Waste entry not found" />
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
            {log.quantityWasted} {log.unit}
          </Text>
          <Text style={styles.meta}>Reason: {log.wasteReason}</Text>
          {isAdmin ? (
            <>
              <Text style={styles.meta}>Unit cost: {formatCostLoss(log.unitCost)}</Text>
              <Text style={styles.loss}>Cost loss: {formatCostLoss(log.costLoss)}</Text>
            </>
          ) : null}
          <Text style={styles.meta}>Logged by: {log.loggedByName || log.loggedBy}</Text>
          <Text style={styles.meta}>
            Timestamp: {log.timestamp.slice(0, 19).replace('T', ' ')}
          </Text>
          <Text style={styles.meta}>Batch ID: {log.batchId}</Text>
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
          title="Back to waste"
          variant="ghost"
          onPress={() => router.replace(`${basePath}/(tabs)/waste` as never)}
        />
      </ScrollView>

      <ConfirmDialog
        visible={voidOpen}
        title="Void this waste entry?"
        message="Inventory quantity will be restored to the source batch. The waste record is kept for history and excluded from active totals."
        confirmLabel="Void entry"
        destructive
        loading={busy}
        onCancel={() => setVoidOpen(false)}
        onConfirm={() => void onVoid()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeActive: { backgroundColor: colors.dangerLight },
  badgeVoided: { backgroundColor: '#E2E8F0' },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.text },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  qty: { fontSize: 28, fontWeight: '800', color: colors.text },
  loss: { fontSize: 16, fontWeight: '700', color: colors.danger },
  meta: { fontSize: 14, color: colors.textSecondary },
});
