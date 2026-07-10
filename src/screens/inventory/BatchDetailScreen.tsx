import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ExpiryBadge } from '@components/inventory/ExpiryBadge';
import { Button } from '@components/ui/Button';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { InlineError } from '@components/ui/InlineError';
import { LoadingState } from '@components/ui/LoadingState';
import { useAuth } from '@hooks/useAuth';
import { useRestaurantSettings } from '@hooks/useRestaurantSettings';
import { inventoryService } from '@services/inventory.service';
import { isActiveBatch } from '@utils/expiry';
import { colors, spacing } from '@constants/theme';
import type { InventoryBatch, ServiceError } from '@/types';

type Props = {
  basePath: '/(admin)' | '/(staff)';
};

export function BatchDetailScreen({ basePath }: Props) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile, isAdmin } = useAuth();
  const { amberDays } = useRestaurantSettings(profile?.restaurantId);
  const [batch, setBatch] = useState<InventoryBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [consumeOpen, setConsumeOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = inventoryService.subscribeBatch(id, (next) => {
      setBatch(next);
      setLoading(false);
    });
    return unsubscribe;
  }, [id]);

  const onConsume = async () => {
    if (!batch || !user?.uid) return;
    setBusy(true);
    setError(null);
    try {
      await inventoryService.markConsumed({ batchId: batch.id, userId: user.uid });
      setConsumeOpen(false);
      Alert.alert('Marked consumed', 'Batch remains available for reports and audit.');
    } catch (err) {
      setError((err as ServiceError).message);
    } finally {
      setBusy(false);
    }
  };

  const onArchive = async () => {
    if (!batch || !user?.uid) return;
    setBusy(true);
    setError(null);
    try {
      await inventoryService.archiveBatch({ batchId: batch.id, userId: user.uid });
      setArchiveOpen(false);
      Alert.alert('Archived', 'Batch removed from active inventory.');
    } catch (err) {
      setError((err as ServiceError).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState message="Loading batch…" />;
  if (!batch) {
    return (
      <View style={styles.screen}>
        <InlineError message="Batch not found" />
        <Button title="Back to inventory" onPress={() => router.back()} />
      </View>
    );
  }

  const canEdit = isActiveBatch(batch);
  const canConsume = !batch.consumed && !batch.archived;

  return (
    <>
      <Stack.Screen options={{ title: batch.ingredientName, headerShown: true }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <InlineError message={error || undefined} />

        <View style={styles.card}>
          <View style={styles.badges}>
            <ExpiryBadge expiryDate={batch.expiryDate} amberDays={amberDays} />
          </View>
          <Text style={styles.qty}>
            {batch.quantity} {batch.unit}
          </Text>
          <Text style={styles.meta}>Supplier: {batch.supplier}</Text>
          <Text style={styles.meta}>Unit cost: ${batch.unitCost.toFixed(2)}</Text>
          <Text style={styles.meta}>Received: {batch.dateReceived}</Text>
          <Text style={styles.meta}>Expires: {batch.expiryDate}</Text>
          <Text style={styles.meta}>
            Status: {batch.archived ? 'Archived' : batch.consumed ? 'Consumed' : 'Active'}
          </Text>
        </View>

        {canEdit ? (
          <Button
            title="Edit batch"
            variant="secondary"
            onPress={() => router.push(`${basePath}/edit-batch/${batch.id}` as never)}
          />
        ) : null}

        {canConsume ? (
          <Button title="Mark consumed" onPress={() => setConsumeOpen(true)} />
        ) : null}

        {canConsume ? (
          <Button
            title="Log waste"
            variant="secondary"
            onPress={() =>
              router.push(`${basePath}/log-waste?batchId=${batch.id}` as never)
            }
          />
        ) : null}

        {isAdmin && !batch.archived ? (
          <Button
            title="Archive batch"
            variant="secondary"
            onPress={() => setArchiveOpen(true)}
          />
        ) : null}

        <Button
          title="Back"
          variant="ghost"
          onPress={() => router.replace(`${basePath}/(tabs)/inventory` as never)}
        />
      </ScrollView>

      <ConfirmDialog
        visible={consumeOpen}
        title="Mark as consumed?"
        message="This hides the batch from active inventory but keeps it for cost, waste, and audit history."
        confirmLabel="Consume"
        loading={busy}
        onCancel={() => setConsumeOpen(false)}
        onConfirm={() => void onConsume()}
      />

      <ConfirmDialog
        visible={archiveOpen}
        title="Archive batch?"
        message="Archived batches are removed from active inventory but never permanently deleted."
        confirmLabel="Archive"
        destructive
        loading={busy}
        onCancel={() => setArchiveOpen(false)}
        onConfirm={() => void onArchive()}
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
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  qty: { fontSize: 28, fontWeight: '800', color: colors.text },
  meta: { fontSize: 14, color: colors.textSecondary },
});
