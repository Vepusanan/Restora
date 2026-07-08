import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type ChartPlaceholderProps = {
  title?: string;
  message?: string;
};

export function ChartPlaceholder({
  title = 'Charts require a development build',
  message = 'Victory Native uses Skia and is not available in Expo Go. Run `npx expo prebuild` and `npx expo run:android` to use charts on device.',
}: ChartPlaceholderProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">{title}</ThemedText>
      <ThemedText style={styles.message}>{message}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  message: {
    opacity: 0.8,
  },
});
