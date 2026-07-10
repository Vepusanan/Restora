import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { UsageCard } from '@components/consumption/UsageCard';
import { UsageFiltersBar } from '@components/consumption/UsageFilters';
import { Button } from '@components/ui/Button';
import { EmptyState } from '@components/ui/EmptyState';
import { InlineError } from '@components/ui/InlineError';
import { useAuth } from '@hooks/useAuth';
import { useConsumptionLogs } from '@hooks/useConsumptionLogs';
import { colors, spacing, TAB_BAR_CLEARANCE } from '@constants/theme';
import { formatConsumptionCost } from '@utils/consumption';

type Props = {
  basePath: '/(admin)' | '/(staff)';
};

export function UsageScreen({ basePath }: Props) {
  const router = useRouter();
  const { profile, isAdmin } = useAuth();
  const { filtered, summary, users, loading, error, filters, setFilters } = useConsumptionLogs(
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
          <Text style={styles.title}>Usage</Text>
          <Text style={styles.subtitle}>
            {profile?.restaurantName ?? 'Restaurant'} · {summary.activeEvents} active events
          </Text>

          {isAdmin ? (
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Consumption cost</Text>
                <Text style={styles.summaryValue}>
                  {formatConsumptionCost(summary.totalConsumptionCost)}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Qty used</Text>
                <Text style={styles.summaryValue}>{summary.quantityUsed}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Qty used</Text>
                <Text style={styles.summaryValue}>{summary.quantityUsed}</Text>
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <View style={styles.actionGrow}>
              <Button
                title="Log usage"
                icon="restaurant-outline"
                onPress={() => router.push(`${basePath}/log-usage` as never)}
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
            <UsageFiltersBar filters={filters} users={users} onChange={setFilters} />
          ) : null}

          <InlineError message={error || undefined} />
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="No usage entries"
          description="Log ingredient usage during prep to track kitchen consumption separately from waste."
        />
      }
      renderItem={({ item }) => (
        <UsageCard
          log={item}
          showFinancials={isAdmin}
          onPress={() => router.push(`${basePath}/usage-entry/${item.id}` as never)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: TAB_BAR_CLEARANCE + spacing.xl },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginBottom: spacing.md, gap: spacing.sm },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
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
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionGrow: { flex: 1 },
});
