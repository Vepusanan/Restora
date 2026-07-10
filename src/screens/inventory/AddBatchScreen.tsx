import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { BatchForm } from '@components/forms/AddBatchForm';
import { useAuth } from '@hooks/useAuth';
import { inventoryService } from '@services/inventory.service';
import { colors, spacing } from '@constants/theme';
import type { CreateBatchFormValues } from '@utils/validators';
import type { ServiceError } from '@/types';

type Props = {
  basePath: '/(admin)' | '/(staff)';
};

export function AddBatchScreen({ basePath }: Props) {
  const router = useRouter();
  const { profile, user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: CreateBatchFormValues) => {
    if (!profile?.restaurantId || !user?.uid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await inventoryService.createBatch({
        restaurantId: profile.restaurantId,
        userId: user.uid,
        data: values,
      });
      Alert.alert('Batch created', `${values.ingredientName} was added to inventory.`);
      router.replace(`${basePath}/(tabs)/inventory` as never);
    } catch (err) {
      setError((err as ServiceError).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Add batch', headerShown: true }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <BatchForm mode="create" submitting={submitting} error={error} onSubmit={onSubmit} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
});
