import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@constants/theme';

type Props = {
  message?: string;
};

export function LoadingState({ message = 'Loading…' }: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.md,
    padding: spacing.lg,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 15,
  },
});
