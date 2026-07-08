import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AnalyticsChart } from '@/src/components/charts/AnalyticsChart';

const SAMPLE_DATA = [
  { label: 'Mon', value: 42 },
  { label: 'Tue', value: 58 },
  { label: 'Wed', value: 35 },
  { label: 'Thu', value: 71 },
  { label: 'Fri', value: 64 },
  { label: 'Sat', value: 48 },
  { label: 'Sun', value: 55 },
];

export default function AnalyticsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Analytics</ThemedText>
        <ThemedText>Weekly progress overview powered by Victory Native.</ThemedText>
      </ThemedView>

      <ThemedView style={styles.chartCard}>
        <AnalyticsChart data={SAMPLE_DATA} />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  chartCard: {
    borderRadius: 16,
    padding: 12,
    minHeight: 320,
  },
});
