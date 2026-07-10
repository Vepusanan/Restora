import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@components/ui/EmptyState';
import { colors, spacing } from '@constants/theme';

export default function StaffWasteScreen() {
  return (
    <View style={styles.content}>
      <Text style={styles.title}>Waste</Text>
      <EmptyState
        title="Waste logging"
        description="Staff can access operational waste logging here. Financial modules stay locked."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
});
