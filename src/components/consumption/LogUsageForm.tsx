import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { InlineError } from '@components/ui/InlineError';
import { SelectField } from '@components/ui/SelectField';
import { useAuth } from '@hooks/useAuth';
import { useInventory } from '@hooks/useInventory';
import { useRestaurantSettings } from '@hooks/useRestaurantSettings';
import { consumptionService } from '@services/consumption.service';
import { USAGE_CATEGORY_OPTIONS } from '@constants/consumption';
import { colors, spacing } from '@constants/theme';
import {
  calculateConsumptionCost,
  formatConsumptionCost,
} from '@utils/consumption';
import {
  allocateFifoConsumption,
  totalAvailableForConsumption,
} from '@utils/fifoAllocation';
import { createUsageSchema } from '@utils/validators';
import { daysUntilExpiry, isActiveBatch, resolveFifoBatchId } from '@utils/expiry';
import type { ServiceError, UsageCategory } from '@/types';

type Props = {
  basePath: '/(admin)' | '/(staff)';
};

export function LogUsageForm({ basePath }: Props) {
  const router = useRouter();
  const params = useLocalSearchParams<{ batchId?: string; ingredientKey?: string }>();
  const { user, profile, isAdmin } = useAuth();
  const { currency } = useRestaurantSettings(profile?.restaurantId);
  const { batches, loading: inventoryLoading } = useInventory(profile?.restaurantId);

  const ingredients = useMemo(() => {
    const map = new Map<string, { key: string; name: string; unit: string }>();
    for (const batch of batches) {
      if (!isActiveBatch(batch) || batch.quantity <= 0) continue;
      if (!map.has(batch.ingredientKey)) {
        map.set(batch.ingredientKey, {
          key: batch.ingredientKey,
          name: batch.ingredientName,
          unit: batch.unit,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [batches]);

  const initialBatch = params.batchId
    ? batches.find((batch) => batch.id === params.batchId)
    : null;

  const [ingredientKey, setIngredientKey] = useState(
    params.ingredientKey ?? initialBatch?.ingredientKey ?? '',
  );
  const [batchMode, setBatchMode] = useState<'fifo' | 'manual'>(
    params.batchId ? 'manual' : 'fifo',
  );
  const [batchId, setBatchId] = useState(params.batchId ?? '');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState<UsageCategory>('Kitchen Use');
  const [notes, setNotes] = useState('');
  const [allowExpired, setAllowExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const ingredientBatches = useMemo(
    () =>
      batches.filter(
        (batch) =>
          batch.ingredientKey === ingredientKey &&
          isActiveBatch(batch) &&
          batch.quantity > 0,
      ),
    [batches, ingredientKey],
  );

  const fifoBatchId = resolveFifoBatchId(ingredientBatches);
  const selectedUnit =
    ingredients.find((item) => item.key === ingredientKey)?.unit ??
    ingredientBatches[0]?.unit ??
    '';

  const available = totalAvailableForConsumption(ingredientBatches, { allowExpired });
  const qtyNumber = Number(quantity);

  const previewAllocations = useMemo(() => {
    if (!ingredientKey || !Number.isFinite(qtyNumber) || qtyNumber <= 0) return [];
    try {
      return allocateFifoConsumption(ingredientBatches, qtyNumber, {
        allowExpired,
        batchId: batchMode === 'manual' ? batchId || null : null,
      });
    } catch {
      return [];
    }
  }, [ingredientKey, qtyNumber, ingredientBatches, allowExpired, batchMode, batchId]);

  const previewCost = previewAllocations.reduce(
    (sum, alloc) => sum + calculateConsumptionCost(alloc.quantityUsed, alloc.unitCost),
    0,
  );

  const hasExpiredInFifo = ingredientBatches.some(
    (batch) => daysUntilExpiry(batch.expiryDate) < 0,
  );

  const onSubmit = async () => {
    if (!user?.uid || !profile?.restaurantId) return;

    const parsed = createUsageSchema.safeParse({
      ingredientKey,
      quantityUsed: qtyNumber,
      category,
      notes: notes.trim() || undefined,
      batchId: batchMode === 'manual' ? batchId || null : null,
      allowExpired,
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

    if (batchMode === 'manual' && !batchId) {
      setFieldErrors({ batchId: 'Select a batch or use Auto FIFO.' });
      setError('Select a batch or use Auto FIFO.');
      return;
    }

    if (parsed.data.quantityUsed > available) {
      setFieldErrors({
        quantityUsed: `Only ${available} ${selectedUnit} available.`,
      });
      setError(`Only ${available} ${selectedUnit} remaining for this ingredient.`);
      return;
    }

    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const result = await consumptionService.createUsageLog({
        restaurantId: profile.restaurantId,
        userId: user.uid,
        displayName: profile.displayName || profile.email,
        data: parsed.data,
        candidateBatches: ingredientBatches,
      });

      const allocSummary = result.allocations
        .map((item) => `${item.quantityUsed} from ${item.batchId.slice(0, 6)}…`)
        .join(', ');

      Alert.alert(
        'Usage logged',
        isAdmin
          ? `Recorded ${parsed.data.quantityUsed} ${selectedUnit} · Cost ${formatConsumptionCost(result.consumptionCost, currency)}${result.allocations.length > 1 ? `\nFIFO: ${allocSummary}` : ''}`
          : `Recorded ${parsed.data.quantityUsed} ${selectedUnit} as ${parsed.data.category}.`,
      );

      const firstId = result.usageLogIds[0];
      if (firstId) {
        router.replace(`${basePath}/usage-entry/${firstId}` as never);
      } else {
        router.replace(`${basePath}/(tabs)/usage` as never);
      }
    } catch (err) {
      setError((err as ServiceError).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Log Usage', headerShown: true }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Log ingredient usage</Text>
        <Text style={styles.subtitle}>
          Record kitchen consumption (not waste). By default, stock is taken from the oldest
          batch first (FIFO), splitting across batches when needed.
        </Text>

        <InlineError message={error || undefined} />

        <Text style={styles.label}>Ingredient</Text>
        {inventoryLoading ? (
          <Text style={styles.meta}>Loading ingredients…</Text>
        ) : ingredients.length === 0 ? (
          <Text style={styles.meta}>No active ingredients available.</Text>
        ) : (
          <View style={styles.batchList}>
            {ingredients.map((item) => {
              const selected = item.key === ingredientKey;
              return (
                <Button
                  key={item.key}
                  title={item.name}
                  variant={selected ? 'primary' : 'secondary'}
                  onPress={() => {
                    setIngredientKey(item.key);
                    setBatchId('');
                    setBatchMode('fifo');
                  }}
                />
              );
            })}
          </View>
        )}
        {fieldErrors.ingredientKey ? (
          <Text style={styles.fieldError}>{fieldErrors.ingredientKey}</Text>
        ) : null}

        {ingredientKey ? (
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>
              Available: {available} {selectedUnit}
            </Text>
            <Text style={styles.meta}>
              Active batches: {ingredientBatches.length}
              {fifoBatchId ? ` · FIFO batch ${fifoBatchId.slice(0, 8)}…` : ''}
            </Text>
          </View>
        ) : null}

        <Text style={styles.label}>Batch allocation</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.chip, batchMode === 'fifo' && styles.chipSelected]}
            onPress={() => {
              setBatchMode('fifo');
              setBatchId('');
            }}
          >
            <Text style={[styles.chipText, batchMode === 'fifo' && styles.chipTextSelected]}>
              Auto FIFO
            </Text>
          </Pressable>
          <Pressable
            style={[styles.chip, batchMode === 'manual' && styles.chipSelected]}
            onPress={() => setBatchMode('manual')}
          >
            <Text style={[styles.chipText, batchMode === 'manual' && styles.chipTextSelected]}>
              Specific batch
            </Text>
          </Pressable>
        </View>

        {batchMode === 'manual' ? (
          <View style={styles.batchList}>
            {ingredientBatches.map((batch) => {
              const selected = batch.id === batchId;
              const expired = daysUntilExpiry(batch.expiryDate) < 0;
              return (
                <Button
                  key={batch.id}
                  title={`${batch.quantity} ${batch.unit} · recv ${batch.dateReceived}${expired ? ' · expired' : ''}${batch.id === fifoBatchId ? ' · FIFO' : ''}`}
                  variant={selected ? 'primary' : 'secondary'}
                  onPress={() => setBatchId(batch.id)}
                />
              );
            })}
            {fieldErrors.batchId ? (
              <Text style={styles.fieldError}>{fieldErrors.batchId}</Text>
            ) : null}
          </View>
        ) : null}

        {hasExpiredInFifo ? (
          <Pressable
            style={[styles.chip, allowExpired && styles.chipSelected]}
            onPress={() => setAllowExpired((v) => !v)}
          >
            <Text style={[styles.chipText, allowExpired && styles.chipTextSelected]}>
              {allowExpired
                ? 'Including expired batches'
                : 'Expired batches excluded (tap to allow)'}
            </Text>
          </Pressable>
        ) : null}

        <Input
          label={`Quantity used${selectedUnit ? ` (${selectedUnit})` : ''}`}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="decimal-pad"
          placeholder="0"
          error={fieldErrors.quantityUsed}
        />

        <SelectField
          label="Usage category"
          value={category}
          options={USAGE_CATEGORY_OPTIONS}
          onChange={setCategory}
          error={fieldErrors.category}
        />

        <Input
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Recipe name, station, etc."
          error={fieldErrors.notes}
        />

        {previewAllocations.length > 0 ? (
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>FIFO preview</Text>
            {previewAllocations.map((alloc) => (
              <Text key={alloc.batchId} style={styles.meta}>
                {alloc.quantityUsed} {alloc.unit} from batch recv {alloc.dateReceived}
                {alloc.remainingAfter === 0 ? ' (will mark consumed)' : ''}
              </Text>
            ))}
            {isAdmin && previewCost > 0 ? (
              <Text style={styles.cost}>{formatConsumptionCost(previewCost, currency)}</Text>
            ) : null}
          </View>
        ) : null}

        <Button title="Submit usage" onPress={() => void onSubmit()} loading={saving} />
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
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chipText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  chipTextSelected: { color: colors.primaryDark },
  preview: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  previewTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cost: { fontSize: 24, fontWeight: '800', color: colors.forest },
  fieldError: { color: colors.danger, fontSize: 13 },
});
