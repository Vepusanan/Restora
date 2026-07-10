import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@components/ui/EmptyState';
import { colors, spacing } from '@constants/theme';

/** Admin-only cost module (FR-008). */
export default function AdminCostScreen() {
  return (
    <View style={styles.content}>
      <Text style={styles.title}>Cost</Text>
      <EmptyState
        title="Admin only"
        description="Cost and financial data is blocked for staff in the UI, route layer, and Firestore Security Rules."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
});
