import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { HeaderBackButton } from '@components/chrome/HeaderBackButton';
import { InventoryValuationCard } from '@components/financial/InventoryValuationCard';
import { CostBreakdownChart } from '@components/financial/CostBreakdownChart';
import { FinancialAccessDenied } from '@components/financial/FinancialAccessDenied';
import { Button } from '@components/ui/Button';
import { useFinancialDashboard } from '@hooks/useFinancialDashboard';
import { useAuth } from '@hooks/useAuth';
import { useRestaurantSettings } from '@hooks/useRestaurantSettings';
import { colors, spacing } from '@constants/theme';
import { formatMoney } from '@utils/financial';

export function CostDashboardScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { currency } = useRestaurantSettings(profile?.restaurantId);
  const {
    allowed,
    loading,
    valuation,
    ingredientCost,
    wasteLoss,
    lastUpdated,
  } = useFinancialDashboard(profile?.restaurantId);

  if (!allowed) {
    return <FinancialAccessDenied />;
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Cost & Expense',
          headerShown: true,
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Cost dashboard</Text>
        <Text style={styles.subtitle}>
          Live valuation from inventory and waste. Updates when batches or waste logs change.
        </Text>

        <InventoryValuationCard
          totalValue={valuation.totalValue}
          batchCount={valuation.batchCount}
          calculatedAt={lastUpdated.toISOString()}
          excludedExpired={valuation.excludedExpired}
          excludedConsumed={valuation.excludedConsumed}
          excludedArchived={valuation.excludedArchived}
          currency={currency}
        />

        <View style={styles.summaryRow}>
          <Pressable
            style={styles.summaryCard}
            onPress={() => router.push('/(admin)/ingredient-cost')}
          >
            <Text style={styles.summaryLabel}>Ingredient cost (MTD)</Text>
            <Text style={styles.summaryValue}>{formatMoney(ingredientCost.totalCost, currency)}</Text>
            <Text style={styles.link}>Open analysis →</Text>
          </Pressable>
          <Pressable
            style={styles.summaryCard}
            onPress={() => router.push('/(admin)/waste-loss')}
          >
            <Text style={styles.summaryLabel}>Waste loss (MTD)</Text>
            <Text style={[styles.summaryValue, styles.danger]}>
              {formatMoney(wasteLoss.totalLoss, currency)}
            </Text>
            <Text style={styles.link}>Open analysis →</Text>
          </Pressable>
        </View>

        <CostBreakdownChart
          title="Top ingredient costs (this month)"
          totalLabel="Total"
          totalValue={ingredientCost.totalCost}
          items={ingredientCost.rows.map((row) => ({
            key: row.ingredientKey,
            label: row.ingredientName,
            value: row.totalCost,
          }))}
        />

        <CostBreakdownChart
          title="Waste loss by reason (this month)"
          totalLabel="Total loss"
          totalValue={wasteLoss.totalLoss}
          items={wasteLoss.rows.map((row) => ({
            key: row.key,
            label: row.label,
            value: row.totalLoss,
          }))}
        />

        <Button
          title="Ingredient cost analysis"
          onPress={() => router.push('/(admin)/ingredient-cost')}
        />
        <Button
          title="Waste loss analysis"
          variant="secondary"
          onPress={() => router.push('/(admin)/waste-loss')}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
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
  summaryLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  summaryValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  danger: { color: colors.danger },
  link: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 4 },
});
