import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { BatchForm } from '@components/forms/AddBatchForm';
import { InlineError } from '@components/ui/InlineError';
import { LoadingState } from '@components/ui/LoadingState';
import { useAuth } from '@hooks/useAuth';
import { inventoryService } from '@services/inventory.service';
import { colors, spacing } from '@constants/theme';
import type { EditBatchFormValues } from '@utils/validators';
import type { InventoryBatch, ServiceError } from '@/types';

type Props = {
  basePath: '/(admin)' | '/(staff)';
};

export function EditBatchScreen({ basePath }: Props) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [batch, setBatch] = useState<InventoryBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void inventoryService
      .getBatch(id)
      .then((next) => {
        setBatch(next);
        setLoading(false);
      })
      .catch((err) => {
        setError((err as ServiceError).message);
        setLoading(false);
      });
  }, [id]);

  const onSubmit = async (values: EditBatchFormValues) => {
    if (!batch || !user?.uid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await inventoryService.editBatch({
        batchId: batch.id,
        userId: user.uid,
        data: values,
      });
      Alert.alert('Batch updated', 'Changes are synced in realtime.');
      router.replace(`${basePath}/batch/${batch.id}` as never);
    } catch (err) {
      setError((err as ServiceError).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading batch…" />;
  if (!batch) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <InlineError message={error || 'Batch not found'} />
      </ScrollView>
    );
  }

  if (batch.consumed || batch.archived) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <InlineError message="Consumed or archived batches cannot be edited." />
      </ScrollView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `Edit ${batch.ingredientName}`, headerShown: true }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <BatchForm
          mode="edit"
          batch={batch}
          submitting={submitting}
          error={error}
          onSubmit={onSubmit}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
});
