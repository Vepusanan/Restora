import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { WasteCard } from '@components/waste/WasteCard';
import { WasteFiltersBar } from '@components/waste/WasteFilters';
import { Button } from '@components/ui/Button';
import { EmptyState } from '@components/ui/EmptyState';
import { InlineError } from '@components/ui/InlineError';
import { useAuth } from '@hooks/useAuth';
import { useWasteLogs } from '@hooks/useWasteLogs';
import { colors, spacing, TAB_BAR_CLEARANCE } from '@constants/theme';
import { formatCostLoss } from '@utils/waste';

type Props = {
  basePath: '/(admin)' | '/(staff)';
};

export function WasteScreen({ basePath }: Props) {
  const router = useRouter();
  const { profile, isAdmin } = useAuth();
  const { filtered, summary, loggers, loading, error, filters, setFilters } = useWasteLogs(
    profile?.restaurantId,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

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
      data={filtered}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Waste</Text>
          <Text style={styles.subtitle}>
            {profile?.restaurantName ?? 'Restaurant'} · {summary.activeEvents} active events
          </Text>

          {isAdmin ? (
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Active loss</Text>
                <Text style={styles.summaryValue}>{formatCostLoss(summary.totalCostLoss)}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Qty wasted</Text>
                <Text style={styles.summaryValue}>{summary.quantityWasted}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Qty wasted</Text>
                <Text style={styles.summaryValue}>{summary.quantityWasted}</Text>
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <View style={styles.actionGrow}>
              <Button
                title="Log waste"
                icon="trash-outline"
                onPress={() => router.push(`${basePath}/log-waste` as never)}
              />
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

          {filtersOpen ? (
            <WasteFiltersBar filters={filters} loggers={loggers} onChange={setFilters} />
          ) : null}

          <InlineError message={error || undefined} />
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="No waste entries"
          description="Log waste against an inventory batch to track quantity and cost loss."
          actionLabel="Log waste"
          onAction={() => router.push(`${basePath}/log-waste` as never)}
          icon="trash-outline"
        />
      }
      renderItem={({ item }) => (
        <WasteCard
          log={item}
          showFinancials={isAdmin}
          onPress={() => router.push(`${basePath}/waste-entry/${item.id}` as never)}
        />
      )}
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
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  summaryLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  summaryValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionGrow: { flex: 1 },
});
