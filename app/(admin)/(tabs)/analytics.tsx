import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@components/ui/EmptyState';
import { colors, spacing } from '@constants/theme';

/** Admin-only analytics surface (FR-008). Staff routes never expose this. */
export default function AdminAnalyticsScreen() {
  return (
    <View style={styles.content}>
      <Text style={styles.title}>Analytics</Text>
      <EmptyState
        title="Admin only"
        description="Financial analytics and summaries are restricted to restaurant admins by route guards and Firestore rules."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
});
