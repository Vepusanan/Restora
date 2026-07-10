import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@constants/theme';
import { EmptyState } from '@components/ui/EmptyState';

/** FR-035 / FR-036+ — shown when a non-admin reaches a financial or analytics screen. */
export function FinancialAccessDenied() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Restricted</Text>
      <EmptyState
        title="Access denied. Admin permission required."
        description="Cost, expense, and analytics data are restricted to restaurant admins by route guards and Firestore Security Rules."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
});
