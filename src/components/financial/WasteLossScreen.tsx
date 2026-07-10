import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { CostBreakdownChart } from '@components/financial/CostBreakdownChart';
import { DateRangeFields } from '@components/financial/DateRangeFields';
import { FinancialAccessDenied } from '@components/financial/FinancialAccessDenied';
import { useFinancialDashboard } from '@hooks/useFinancialDashboard';
import { useAuth } from '@hooks/useAuth';
import { WASTE_REASON_OPTIONS } from '@constants/waste';
import { colors, spacing } from '@constants/theme';
import { formatMoney } from '@utils/financial';
import type { WasteReason } from '@/types';

export function WasteLossScreen() {
  const { profile } = useAuth();
  const {
    allowed,
    loading,
    wasteLoss,
    wasteRange,
    setWasteRange,
    wasteReason,
    setWasteReason,
    wasteIngredient,
    setWasteIngredient,
    wasteIngredientOptions,
  } = useFinancialDashboard(profile?.restaurantId);

  const ingredients = useMemo(
    () => ['All', ...wasteIngredientOptions],
    [wasteIngredientOptions],
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
      <Stack.Screen options={{ title: 'Waste Loss', headerShown: true }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Waste loss by date</Text>
        <Text style={styles.subtitle}>
          Sum of stored costLoss for non-voided waste entries in the selected range.
        </Text>

        <DateRangeFields range={wasteRange} onChange={setWasteRange} />

        <Text style={styles.label}>Waste reason</Text>
        <View style={styles.chips}>
          <Pressable
            style={[styles.chip, !wasteReason && styles.chipSelected]}
            onPress={() => setWasteReason(null)}
          >
            <Text style={[styles.chipText, !wasteReason && styles.chipTextSelected]}>Any</Text>
          </Pressable>
          {WASTE_REASON_OPTIONS.map((option) => {
            const selected = wasteReason === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setWasteReason(option.value as WasteReason)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Ingredient</Text>
        <View style={styles.chips}>
          {ingredients.map((name) => {
            const selected =
              (name === 'All' && !wasteIngredient) || name === wasteIngredient;
            return (
              <Pressable
                key={name}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setWasteIngredient(name === 'All' ? null : name)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.stat}>
          <Text style={styles.statLabel}>Active waste events</Text>
          <Text style={styles.statValue}>{wasteLoss.eventCount}</Text>
        </View>

        <CostBreakdownChart
          title="Loss breakdown"
          totalLabel="Total waste loss"
          totalValue={wasteLoss.totalLoss}
          items={wasteLoss.rows.map((row) => ({
            key: row.key,
            label: row.label,
            value: row.totalLoss,
          }))}
          emptyMessage="No active waste loss in this date range."
        />

        {wasteLoss.rows.map((row) => (
          <View key={row.key} style={styles.detail}>
            <Text style={styles.detailTitle}>{row.label}</Text>
            <Text style={styles.meta}>
              {row.eventCount} event{row.eventCount === 1 ? '' : 's'}
            </Text>
            <Text style={styles.detailCost}>{formatMoney(row.totalLoss)}</Text>
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
  detailCost: { fontSize: 18, fontWeight: '800', color: colors.danger },
});
