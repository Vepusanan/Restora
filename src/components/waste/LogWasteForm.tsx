import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { InlineError } from '@components/ui/InlineError';
import { SelectField } from '@components/ui/SelectField';
import { useAuth } from '@hooks/useAuth';
import { useInventory } from '@hooks/useInventory';
import { wasteService } from '@services/waste.service';
import { WASTE_REASON_OPTIONS } from '@constants/waste';
import { colors, spacing } from '@constants/theme';
import { calculateCostLoss, formatCostLoss } from '@utils/waste';
import { createWasteSchema } from '@utils/validators';
import { isActiveBatch } from '@utils/expiry';
import type { ServiceError, WasteReason } from '@/types';

type Props = {
  basePath: '/(admin)' | '/(staff)';
};

export function LogWasteForm({ basePath }: Props) {
  const router = useRouter();
  const params = useLocalSearchParams<{ batchId?: string }>();
  const { user, profile } = useAuth();
  const { batches, loading: inventoryLoading } = useInventory(profile?.restaurantId);

  const activeBatches = useMemo(
    () => batches.filter((batch) => isActiveBatch(batch) && batch.quantity > 0),
    [batches],
  );

  const [batchId, setBatchId] = useState(params.batchId ?? '');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState<WasteReason>('Expired');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const selected = activeBatches.find((batch) => batch.id === batchId) ?? null;
  const qtyNumber = Number(quantity);
  const previewLoss =
    selected && Number.isFinite(qtyNumber) && qtyNumber > 0
      ? calculateCostLoss(qtyNumber, selected.unitCost)
      : 0;

  const onSubmit = async () => {
    if (!user?.uid || !profile?.restaurantId) return;

    const parsed = createWasteSchema.safeParse({
      batchId,
      quantityWasted: qtyNumber,
      wasteReason: reason,
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      setError(next.form ?? 'Fix the highlighted fields.');
      return;
    }

    if (selected && parsed.data.quantityWasted > selected.quantity) {
      setFieldErrors({
        quantityWasted: `Only ${selected.quantity} ${selected.unit} remaining.`,
      });
      setError(`Only ${selected.quantity} ${selected.unit} remaining on this batch.`);
      return;
    }

    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const result = await wasteService.createWasteLog({
        restaurantId: profile.restaurantId,
        userId: user.uid,
        displayName: profile.displayName || profile.email,
        data: parsed.data,
      });
      Alert.alert(
        'Waste logged',
        `Recorded ${parsed.data.quantityWasted} ${selected?.unit ?? ''} · Loss ${formatCostLoss(result.costLoss)}`,
      );
      router.replace(`${basePath}/waste-entry/${result.wasteLogId}` as never);
    } catch (err) {
      setError((err as ServiceError).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Log Waste', headerShown: true }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Log waste event</Text>
        <Text style={styles.subtitle}>
          Select an active batch, enter the quantity wasted, and choose a reason. Cost loss is
          calculated server-side.
        </Text>

        <InlineError message={error || undefined} />

        <Text style={styles.label}>Inventory batch</Text>
        {inventoryLoading ? (
          <Text style={styles.meta}>Loading batches…</Text>
        ) : activeBatches.length === 0 ? (
          <Text style={styles.meta}>No active batches available.</Text>
        ) : (
          <View style={styles.batchList}>
            {activeBatches.map((batch) => {
              const selectedBatch = batch.id === batchId;
              return (
                <Button
                  key={batch.id}
                  title={`${batch.ingredientName} · ${batch.quantity} ${batch.unit}`}
                  variant={selectedBatch ? 'primary' : 'secondary'}
                  onPress={() => setBatchId(batch.id)}
                />
              );
            })}
          </View>
        )}
        {fieldErrors.batchId ? <Text style={styles.fieldError}>{fieldErrors.batchId}</Text> : null}

        {selected ? (
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>{selected.ingredientName}</Text>
            <Text style={styles.meta}>
              Remaining: {selected.quantity} {selected.unit}
            </Text>
            <Text style={styles.meta}>Unit cost: {formatCostLoss(selected.unitCost)}</Text>
            <Text style={styles.meta}>Received: {selected.dateReceived}</Text>
          </View>
        ) : null}

        <Input
          label={`Quantity wasted${selected ? ` (${selected.unit})` : ''}`}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="decimal-pad"
          placeholder="0"
          error={fieldErrors.quantityWasted}
        />

        <SelectField
          label="Waste reason"
          value={reason}
          options={WASTE_REASON_OPTIONS}
          onChange={setReason}
          error={fieldErrors.wasteReason}
        />

        {previewLoss > 0 ? (
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>Estimated cost loss</Text>
            <Text style={styles.loss}>{formatCostLoss(previewLoss)}</Text>
            <Text style={styles.meta}>Final value is calculated on the server.</Text>
          </View>
        ) : null}

        <Button title="Submit waste log" onPress={() => void onSubmit()} loading={saving} />
        <Button title="Cancel" variant="ghost" onPress={() => router.back()} disabled={saving} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  meta: { fontSize: 13, color: colors.textSecondary },
  batchList: { gap: spacing.sm },
  preview: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  previewTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  loss: { fontSize: 28, fontWeight: '800', color: colors.danger },
  fieldError: { color: colors.danger, fontSize: 13 },
});
