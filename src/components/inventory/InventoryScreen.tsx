import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BatchCard } from '@components/inventory/BatchCard';
import { InventoryFiltersBar } from '@components/inventory/InventoryFilters';
import { Button } from '@components/ui/Button';
import { EmptyState } from '@components/ui/EmptyState';
import { InlineError } from '@components/ui/InlineError';
import { useAuth } from '@hooks/useAuth';
import { useInventory } from '@hooks/useInventory';
import { useRestaurantSettings } from '@hooks/useRestaurantSettings';
import { colors, spacing, TAB_BAR_CLEARANCE } from '@constants/theme';
import type { IngredientGroup } from '@/types';

type Props = {
  /** Base path prefix for navigation: '/(admin)' or '/(staff)' */
  basePath: '/(admin)' | '/(staff)';
};

export function InventoryScreen({ basePath }: Props) {
  const router = useRouter();
  const { profile, isAdmin } = useAuth();
  const { currency } = useRestaurantSettings(profile?.restaurantId);
  const {
    groups,
    suppliers,
    loading,
    error,
    filters,
    setFilters,
    now,
    batches,
    amberDays,
  } = useInventory(profile?.restaurantId);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const openAdd = useCallback(() => {
    router.push(`${basePath}/add-batch` as never);
  }, [basePath, router]);

  const openBatch = useCallback(
    (batchId: string) => {
      router.push(`${basePath}/batch/${batchId}` as never);
    },
    [basePath, router],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <Text style={styles.subtitle}>
          {profile?.restaurantName ?? 'Restaurant'} · {batches.length} batches
        </Text>

        <View style={styles.actions}>
          <View style={styles.actionGrow}>
            <Button title="Add batch" icon="add" onPress={openAdd} />
          </View>
          <View style={styles.actionGrow}>
            <Button
              title={filtersOpen ? 'Hide filters' : 'Filters'}
              variant="secondary"
              icon="options-outline"
              onPress={() => setFiltersOpen((v) => !v)}
            />
          </View>
        </View>

        {isAdmin ? (
          <View style={styles.actions}>
            <View style={styles.actionGrow}>
              <Button
                title="Expiry"
                variant="ghost"
                icon="settings-outline"
                onPress={() => router.push('/(admin)/restaurant-settings' as never)}
              />
            </View>
            <View style={styles.actionGrow}>
              <Button
                title="Alerts"
                variant="ghost"
                icon="notifications-outline"
                onPress={() => router.push('/(admin)/(tabs)/inbox' as never)}
              />
            </View>
          </View>
        ) : null}

        {filtersOpen ? (
          <InventoryFiltersBar
            filters={filters}
            suppliers={suppliers}
            onChange={setFilters}
          />
        ) : null}

        <InlineError message={error || undefined} />
      </View>
    ),
    [
      profile?.restaurantName,
      batches.length,
      openAdd,
      filtersOpen,
      filters,
      suppliers,
      setFilters,
      error,
      isAdmin,
      router,
    ],
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.forest} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={groups}
      keyExtractor={(item) => item.ingredientKey}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        <EmptyState
          title="No inventory batches"
          description="Create your first batch to start FIFO tracking and expiry monitoring."
          actionLabel="Add batch"
          onAction={openAdd}
          icon="cube-outline"
        />
      }
      renderItem={({ item }: { item: IngredientGroup }) => (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>{item.ingredientName}</Text>
          {item.batches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              isFifo={item.fifoBatchId === batch.id}
              now={now}
              amberDays={amberDays}
              currency={currency}
              onPress={() => openBatch(batch.id)}
            />
          ))}
        </View>
      )}
      ListFooterComponent={
        isAdmin ? (
          <Pressable onPress={() => Alert.alert('Tip', 'Archive is available from batch details.')}>
            <Text style={styles.footerHint}>Admin: archive batches from detail view</Text>
          </Pressable>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: TAB_BAR_CLEARANCE + spacing.lg },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  header: { marginBottom: spacing.md, gap: spacing.sm },
  title: { fontSize: 28, fontWeight: '800', color: colors.forest },
  subtitle: { fontSize: 14, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionGrow: { flex: 1 },
  group: { marginBottom: spacing.lg },
  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  footerHint: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.md,
  },
});
