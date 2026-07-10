import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AiInsightsPanel } from '@components/analytics/AiInsightsPanel';
import { AnalyticsSummaryCards } from '@components/analytics/AnalyticsSummaryCards';
import { ConsumptionAnalyticsPanel } from '@components/analytics/ConsumptionAnalyticsPanel';
import { TopWastedTable } from '@components/analytics/TopWastedTable';
import { WasteTrendChart } from '@components/analytics/WasteTrendChart';
import { CostBreakdownChart } from '@components/financial/CostBreakdownChart';
import { DateRangeFields } from '@components/financial/DateRangeFields';
import { FinancialAccessDenied } from '@components/financial/FinancialAccessDenied';
import { InventoryValuationCard } from '@components/financial/InventoryValuationCard';
import { Button } from '@components/ui/Button';
import { InlineError } from '@components/ui/InlineError';
import { SelectField } from '@components/ui/SelectField';
import { useAiAnalytics } from '@hooks/useAiAnalytics';
import { useAnalyticsDashboard } from '@hooks/useAnalyticsDashboard';
import { useAuth } from '@hooks/useAuth';
import { useRestaurantSettings } from '@hooks/useRestaurantSettings';
import { analyticsExportService } from '@services/analytics-export.service';
import { colors, spacing, TAB_BAR_CLEARANCE } from '@constants/theme';
import type { AggregationPeriod, AnalyticsExportFormat, ServiceError } from '@/types';

const PERIOD_OPTIONS: { value: AggregationPeriod; label: string }[] = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

const LIMIT_OPTIONS: { value: '5' | '10' | '20'; label: string }[] = [
  { value: '5', label: 'Top 5' },
  { value: '10', label: 'Top 10' },
  { value: '20', label: 'Top 20' },
];

const FORMAT_OPTIONS: { value: AnalyticsExportFormat; label: string }[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'pdf', label: 'PDF' },
];

export function AnalyticsDashboardScreen() {
  const { profile, isAdmin } = useAuth();
  const { currency } = useRestaurantSettings(profile?.restaurantId);
  const {
    allowed,
    loading,
    error,
    range,
    setRange,
    period,
    setPeriod,
    topLimit,
    setTopLimit,
    valuation,
    wasteTrends,
    totalWasteCost,
    topWasted,
    consumptionTrends,
    totalConsumptionCost,
    topConsumed,
    consumptionByCategory,
    inventoryTurnover,
    ingredientBreakdown,
    totalIngredientCost,
    lastUpdated,
    snapshot,
  } = useAnalyticsDashboard(profile?.restaurantId);

  const ai = useAiAnalytics(profile?.restaurantId);

  const [exportFormat, setExportFormat] = useState<AnalyticsExportFormat>('csv');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Inside /(admin) this should always be true; keep a hard deny for safety.
  if (!allowed && !isAdmin) {
    return <FinancialAccessDenied />;
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading analytics…</Text>
      </View>
    );
  }

  const onExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await analyticsExportService.export(
        { ...snapshot, generatedAt: new Date().toISOString() },
        exportFormat,
      );
      Alert.alert('Export ready', `${exportFormat.toUpperCase()} report shared successfully.`);
    } catch (err) {
      setExportError((err as ServiceError).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Analytics</Text>
      <Text style={styles.subtitle}>
        Live waste, consumption, cost, and inventory insights for{' '}
        {profile?.restaurantName ?? 'your restaurant'}. Updates automatically when inventory,
        waste, or usage changes.
      </Text>

      <InlineError message={error || undefined} />

      <DateRangeFields range={range} onChange={setRange} />

      <SelectField
        label="Trend aggregation"
        value={period}
        options={PERIOD_OPTIONS}
        onChange={setPeriod}
      />

      <AnalyticsSummaryCards
        lastUpdated={lastUpdated.toISOString()}
        currency={currency}
        cards={[
          { label: 'Inventory value', value: valuation.totalValue, tone: 'primary' },
          { label: 'Waste cost', value: totalWasteCost, tone: 'danger' },
          { label: 'Consumption cost', value: totalConsumptionCost, tone: 'primary' },
          { label: 'Ingredient cost', value: totalIngredientCost },
        ]}
      />

      <AiInsightsPanel
        report={ai.report}
        loadingCache={ai.loadingCache}
        generating={ai.generating}
        error={ai.error}
        range={range}
        onGenerate={() => void ai.generate(range)}
      />

      <InventoryValuationCard
        totalValue={valuation.totalValue}
        batchCount={valuation.batchCount}
        calculatedAt={lastUpdated.toISOString()}
        excludedExpired={valuation.excludedExpired}
        excludedConsumed={valuation.excludedConsumed}
        excludedArchived={valuation.excludedArchived}
        currency={currency}
      />

      <WasteTrendChart
        title={`Waste cost trend (${period})`}
        points={wasteTrends}
      />

      <ConsumptionAnalyticsPanel
        currency={currency}
        totalConsumptionCost={totalConsumptionCost}
        trends={consumptionTrends}
        topConsumed={topConsumed}
        byCategory={consumptionByCategory}
        turnover={inventoryTurnover}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ranking limit</Text>
        <View style={styles.chips}>
          {LIMIT_OPTIONS.map((option) => {
            const selected = String(topLimit) === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setTopLimit(Number(option.value) as 5 | 10 | 20)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <TopWastedTable rows={topWasted} />

      <CostBreakdownChart
        title="Ingredient cost breakdown"
        totalLabel="Total ingredient cost in range"
        totalValue={totalIngredientCost}
        items={ingredientBreakdown.map((row) => ({
          key: row.ingredientKey,
          label: `${row.ingredientName} (${row.percentage.toFixed(0)}%)`,
          value: row.totalCost,
        }))}
        emptyMessage="No ingredient purchases in this date range."
      />

      <View style={styles.exportCard}>
        <Text style={styles.sectionTitle}>Export dashboard report</Text>
        <Text style={styles.subtitle}>
          Includes summary cards, waste trends, top wasted ingredients, cost breakdown, and
          inventory valuation for the selected range.
        </Text>
        <SelectField
          label="Format"
          value={exportFormat}
          options={FORMAT_OPTIONS}
          onChange={setExportFormat}
        />
        <InlineError message={exportError || undefined} />
        <Button
          title={`Export ${exportFormat.toUpperCase()}`}
          onPress={() => void onExport()}
          loading={exporting}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: TAB_BAR_CLEARANCE + spacing.lg },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  loadingText: { color: colors.textSecondary },
  title: { fontSize: 28, fontWeight: '800', color: colors.forest },
  subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  section: { gap: spacing.xs },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  chipSelected: { borderColor: colors.forest, backgroundColor: colors.limeSoft },
  chipText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  chipTextSelected: { color: colors.forest },
  exportCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
