import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@constants/theme';
import { EmptyState } from '@components/ui/EmptyState';

/** FR-035 — shown when a non-admin reaches a financial screen. */
export function FinancialAccessDenied() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Cost & Expense</Text>
      <EmptyState
        title="Access denied. Admin permission required."
        description="Financial data including inventory valuation, ingredient cost, and waste loss is restricted to restaurant admins."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
});
