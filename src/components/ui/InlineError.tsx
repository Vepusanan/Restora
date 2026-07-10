import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@constants/theme';

type Props = {
  message?: string;
};

export function InlineError({ message }: Props) {
  if (!message) return null;
  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.dangerLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  text: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});
