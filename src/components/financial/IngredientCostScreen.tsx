import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { CostBreakdownChart } from '@components/financial/CostBreakdownChart';
import { DateRangeFields } from '@components/financial/DateRangeFields';
import { FinancialAccessDenied } from '@components/financial/FinancialAccessDenied';
import { useFinancialDashboard } from '@hooks/useFinancialDashboard';
import { useAuth } from '@hooks/useAuth';
import { useRestaurantSettings } from '@hooks/useRestaurantSettings';
import { colors, spacing } from '@constants/theme';
import { formatMoney } from '@utils/financial';

export function IngredientCostScreen() {
  const { profile } = useAuth();
  const { currency } = useRestaurantSettings(profile?.restaurantId);
  const {
    allowed,
    loading,
    ingredientCost,
    ingredientRange,
    setIngredientRange,
    ingredientName,
    setIngredientName,
    supplier,
    setSupplier,
    ingredientOptions,
    suppliers,
  } = useFinancialDashboard(profile?.restaurantId);

  const chipIngredients = useMemo(
    () => ['All', ...ingredientOptions],
    [ingredientOptions],
  );

  if (!allowed) return <FinancialAccessDenied />;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Ingredient Cost', headerShown: true }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ingredient cost by date</Text>
        <Text style={styles.subtitle}>
          Sum of received quantity × unit cost for batches received in the selected range.
        </Text>

        <DateRangeFields range={ingredientRange} onChange={setIngredientRange} />

        <Text style={styles.label}>Ingredient</Text>
        <View style={styles.chips}>
          {chipIngredients.map((name) => {
            const selected =
              (name === 'All' && !ingredientName) || name === ingredientName;
            return (
              <Pressable
                key={name}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setIngredientName(name === 'All' ? null : name)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Supplier</Text>
        <View style={styles.chips}>
          <Pressable
            style={[styles.chip, !supplier && styles.chipSelected]}
            onPress={() => setSupplier(null)}
          >
            <Text style={[styles.chipText, !supplier && styles.chipTextSelected]}>Any</Text>
          </Pressable>
          {suppliers.map((name) => {
            const selected = supplier === name;
            return (
              <Pressable
                key={name}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setSupplier(name)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.stat}>
          <Text style={styles.statLabel}>Batches in range</Text>
          <Text style={styles.statValue}>{ingredientCost.batchCount}</Text>
        </View>

        <CostBreakdownChart
          title="Cost by ingredient"
          totalLabel="Total ingredient cost"
          totalValue={ingredientCost.totalCost}
          currency={currency}
          items={ingredientCost.rows.map((row) => ({
            key: row.ingredientKey,
            label: `${row.ingredientName} (${row.totalQuantity} ${row.unit})`,
            value: row.totalCost,
          }))}
          emptyMessage="No batches received in this date range."
        />

        {ingredientCost.rows.map((row) => (
          <View key={row.ingredientKey} style={styles.detail}>
            <Text style={styles.detailTitle}>{row.ingredientName}</Text>
            <Text style={styles.meta}>
              {row.batchCount} batch{row.batchCount === 1 ? '' : 'es'} · {row.totalQuantity}{' '}
              {row.unit}
            </Text>
            <Text style={styles.detailCost}>{formatMoney(row.totalCost, currency)}</Text>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  chipTextSelected: { color: colors.primaryDark },
  stat: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  statLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  detail: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  detailTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textSecondary },
  detailCost: { fontSize: 18, fontWeight: '800', color: colors.primary },
});
